package com.assurance.sante.connect.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "active_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActiveSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    @Column(name = "full_name")
    private String fullName;

    @Column(unique = false)
    private String email;

    private String role;

    @Column(name = "login_time")
    private LocalDateTime loginTime;

    @Column(name = "last_activity")
    private LocalDateTime lastActivity;

    private boolean active;
}
