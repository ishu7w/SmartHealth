package com.smarthealth;

import jakarta.persistence.LockModeType;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

interface Conversations extends JpaRepository<PortalModels.Conversation, Long> {
  List<PortalModels.Conversation> findByPatientIdOrderByUpdatedAtDesc(Long id);
  List<PortalModels.Conversation> findByDoctorIdOrderByUpdatedAtDesc(Long id);
  List<PortalModels.Conversation> findAllByOrderByUpdatedAtDesc();

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select c from CareConversation c where c.id=:id")
  Optional<PortalModels.Conversation> lockById(@Param("id") Long id);

  void deleteByPatientId(Long id);
}

interface CareMessages extends JpaRepository<PortalModels.Message, Long> {
  org.springframework.data.domain.Page<PortalModels.Message> findByConversationIdOrderByIdDesc(
    Long id,
    org.springframework.data.domain.Pageable page
  );
  void deleteByConversationId(Long id);
}

interface FollowUpTasks extends JpaRepository<PortalModels.Task, Long> {
  List<PortalModels.Task> findByPatientIdOrderByDueDateAscIdAsc(Long id);
  void deleteByPatientId(Long id);
}
