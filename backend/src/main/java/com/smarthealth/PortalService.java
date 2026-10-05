package com.smarthealth;

import java.time.*;
import java.util.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
class PortalService {

  final HealthcareService health;
  final Patients patients;
  final Users users;
  final Conversations conversations;
  final CareMessages messages;
  final FollowUpTasks tasks;

  PortalService(
    HealthcareService h,
    Patients p,
    Users u,
    Conversations c,
    CareMessages m,
    FollowUpTasks t
  ) {
    health = h;
    patients = p;
    users = u;
    conversations = c;
    messages = m;
    tasks = t;
  }

  List<PortalModels.Conversation> visible(Models.User u) {
    if (
      u.role.equals("ADMIN")
    ) return conversations.findAllByOrderByUpdatedAtDesc();
    if (
      u.role.equals("DOCTOR")
    ) return conversations.findByDoctorIdOrderByUpdatedAtDesc(u.id);
    return patients
      .findByUserId(u.id)
      .map(p -> conversations.findByPatientIdOrderByUpdatedAtDesc(p.id))
      .orElse(List.of());
  }

  PortalModels.Conversation access(Long id, Models.User u, boolean lock) {
    var c = (
      lock ? conversations.lockById(id) : conversations.findById(id)
    ).orElseThrow(() ->
      new ResponseStatusException(
        HttpStatus.NOT_FOUND,
        "Conversation not found"
      )
    );
    if (u.role.equals("ADMIN")) return c;
    if (u.role.equals("DOCTOR")) {
      if (!u.id.equals(c.doctorId)) throw new ResponseStatusException(
        HttpStatus.FORBIDDEN,
        "This conversation belongs to a different care team"
      );
    } else health.access(c.patientId, u);
    return c;
  }

  PortalModels.Conversation create(
    PortalController.NewConversation input,
    Models.User u
  ) {
    var p = health.access(input.patientId(), u);
    if (p.userId == null) throw new ResponseStatusException(
      HttpStatus.CONFLICT,
      "This patient needs a portal account before messaging"
    );
    var doctor = users
      .findById(input.doctorId())
      .map(d -> (Models.User) org.hibernate.Hibernate.unproxy(d))
      .filter(d -> d.enabled && d.role.equals("DOCTOR"))
      .orElseThrow(() ->
        new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Choose an active doctor"
        )
      );
    if (
      u.role.equals("DOCTOR") && !u.id.equals(doctor.id)
    ) throw new ResponseStatusException(
      HttpStatus.FORBIDDEN,
      "Start a conversation as yourself"
    );
    var c = new PortalModels.Conversation();
    c.patientId = p.id;
    c.patientName = p.name;
    c.doctorId = doctor.id;
    c.doctorName = doctor.name;
    c.subject = input.subject().trim();
    conversations.save(c);
    send(c, input.body(), u);
    return c;
  }

  Map<String, Object> thread(Long id, int page, Models.User u) {
    var c = access(id, u, false);
    var result = messages.findByConversationIdOrderByIdDesc(
      id,
      PageRequest.of(page, 50)
    );
    var items = new ArrayList<>(result.getContent());
    Collections.reverse(items);
    return Map.of(
      "conversation",
      c,
      "messages",
      items,
      "hasOlder",
      result.hasNext(),
      "page",
      page
    );
  }

  void read(Long id, Long messageId, Models.User u) {
    var c = access(id, u, true);
    var m = messages
      .findById(messageId)
      .filter(x -> x.conversationId.equals(id))
      .orElseThrow(() ->
        new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Message does not belong to this conversation"
        )
      );
    // Acknowledge only the last message the client actually displayed.
    if (
      u.role.equals("PATIENT") &&
      (c.patientReadAt == null || m.createdAt.isAfter(c.patientReadAt))
    ) c.patientReadAt = m.createdAt;
    if (
      u.role.equals("DOCTOR") &&
      (c.doctorReadAt == null || m.createdAt.isAfter(c.doctorReadAt))
    ) c.doctorReadAt = m.createdAt;
  }

  PortalModels.Message reply(Long id, String body, Models.User u) {
    return send(access(id, u, true), body, u);
  }

  PortalModels.Message send(
    PortalModels.Conversation c,
    String body,
    Models.User u
  ) {
    if (
      !users
        .findById(c.doctorId)
        .map(d -> ((Models.User) org.hibernate.Hibernate.unproxy(d)).enabled)
        .orElse(false)
    ) throw new ResponseStatusException(
      HttpStatus.CONFLICT,
      "This doctor is unavailable. Choose another care team"
    );
    var m = new PortalModels.Message();
    m.conversationId = c.id;
    m.senderId = u.id;
    m.senderName = u.name;
    m.senderRole = u.role;
    m.body = body.trim();
    messages.save(m);
    c.updatedAt = m.createdAt;
    if (u.role.equals("PATIENT")) c.patientReadAt = m.createdAt;
    if (u.role.equals("DOCTOR")) c.doctorReadAt = m.createdAt;
    return m;
  }

  List<PortalModels.Task> tasks(Long patient, Models.User u) {
    health.access(patient, u);
    return tasks.findByPatientIdOrderByDueDateAscIdAsc(patient);
  }

  PortalModels.Task addTask(
    Long patient,
    PortalController.NewTask input,
    Models.User u
  ) {
    health.access(patient, u);
    if (
      input.dueDate().isAfter(LocalDate.now().plusYears(2))
    ) throw new ResponseStatusException(
      HttpStatus.BAD_REQUEST,
      "Choose a due date within two years"
    );
    var t = new PortalModels.Task();
    t.patientId = patient;
    t.title = input.title().trim();
    t.instructions = input.instructions().trim();
    t.dueDate = input.dueDate();
    t.createdBy = u.name;
    t.source = u.role.equals("PATIENT") ? "Personal task" : "Care team task";
    return tasks.save(t);
  }

  PortalModels.Task updateTask(
    Long id,
    PortalController.TaskChange input,
    Models.User u
  ) {
    var t = tasks
      .findById(id)
      .orElseThrow(() ->
        new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found")
      );
    health.access(t.patientId, u);
    if (t.version != input.version()) throw new ResponseStatusException(
      HttpStatus.CONFLICT,
      "This task changed. Refresh and try again"
    );
    t.status = input.status();
    t.updatedAt = Instant.now();
    return tasks.save(t);
  }
}
