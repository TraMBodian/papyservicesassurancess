package com.assurance.sante.connect.repository;

import com.assurance.sante.connect.entity.ActiveSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ActiveSessionRepository extends JpaRepository<ActiveSession, Long> {

    List<ActiveSession> findByActiveTrue();

    Optional<ActiveSession> findByEmailAndActiveTrue(String email);
}
