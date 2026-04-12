package com.assurance.sante.connect.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "familles_assurance")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FamilleAssurance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String principal;

    private String telephone;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_principal")
    private TypeAssure typePrincipal = TypeAssure.ADULTE;

    @Column(name = "photo", columnDefinition = "TEXT")
    private String photo;

    @ElementCollection
    @CollectionTable(name = "famille_beneficiaires", joinColumns = @JoinColumn(name = "famille_id"))
    @Column(name = "beneficiaire", length = 500)
    private List<String> beneficiaires;

    /** Détail JSON des bénéficiaires (dateNaissance, sexe, lien, etc.) */
    @Column(name = "beneficiaires_detail", columnDefinition = "TEXT")
    private String beneficiairesDetail;

    /** Date de naissance du principal */
    @Column(name = "date_naissance_principal")
    private String dateNaissancePrincipal;

    /** Pièce d'identité du principal */
    @Column(name = "piece_identite_principal")
    private String pieceIdentitePrincipal;

    @Column(name = "date_debut")
    private String dateDebut;

    @Column(name = "duree_garantie")
    private String dureeGarantie = "1";

    @Column(name = "echeance_auto")
    private Boolean echeanceAuto = true;

    private String prime;

    @Column(name = "prime_nette")
    private String primeNette;

    private String taxes;

    @Enumerated(EnumType.STRING)
    private StatutContrat statut = StatutContrat.ACTIF;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() { this.updatedAt = LocalDateTime.now(); }

    public enum TypeAssure { ADULTE, ADULTE_AGE }
    public enum StatutContrat { ACTIF, SUSPENDU, RESILIE }
}
