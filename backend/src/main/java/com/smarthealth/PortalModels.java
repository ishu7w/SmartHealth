package com.smarthealth;

import jakarta.persistence.*;
import java.time.Instant;

public final class PortalModels {

  @Entity(name = "CareConversation")
  @Table(
    name = "care_conversations",
    indexes = {
      @Index(columnList = "patientId,updatedAt"),
      @Index(columnList = "doctorId,updatedAt"),
    }
  )
  public static class Conversation extends CareModels.PatientItem {

    public Long doctorId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
      name = "doctorId",
      insertable = false,
      updatable = false,
      nullable = false
    )
    @com.fasterxml.jackson.annotation.JsonIgnore
    public Models.User doctor;

    public String subject, patientName, doctorName;
    public Instant updatedAt = Instant.now();
    public Instant patientReadAt, doctorReadAt;
  }

  @Entity
  @Table(
    name = "care_messages",
    indexes = @Index(columnList = "conversationId,id")
  )
  public static class Message extends Models.Row {

    public Long conversationId, senderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
      name = "conversationId",
      insertable = false,
      updatable = false,
      nullable = false
    )
    @com.fasterxml.jackson.annotation.JsonIgnore
    public Conversation conversation;

    public String senderName, senderRole;

    @Column(length = 4000, nullable = false)
    public String body;
  }

  @Entity(name = "FollowUpTask")
  @Table(
    name = "follow_up_tasks",
    indexes = @Index(columnList = "patientId,dueDate")
  )
  public static class Task extends CareModels.PatientItem {

    public String title;

    @Column(length = 2000)
    public String instructions;

    public java.time.LocalDate dueDate;
    public String status = "Open",
      createdBy,
      source;
    public Instant updatedAt = Instant.now();

    @Version
    public long version;
  }
}
