package com.assurance.sante.connect.dto;

import lombok.*;
import com.assurance.sante.connect.entity.Assure;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssureDto {
    private Long id;
    private String numero;
    private String nom;
    private String prenom;
    private String telephone;
    private String email;
    private String statut;
    private String type;
    private String adresse;
    private String prime;
    private String dateDebut;
    private String dateFin;
    private java.util.List<String> beneficiaires;
    private String secteur;
    private Integer employes;
    private Integer assures;

    // Champs population
    private String dateNaissance;
    private String sexe;
    private String pieceIdentite;
    private String lien;
    private String dateAdhesion;
    private String salaire;
    private String garantie;

    public static AssureDto fromEntity(Assure a) {
        return AssureDto.builder()
            .id(a.getId())
            .numero(a.getNumero())
            .nom(a.getNom())
            .prenom(a.getPrenom())
            .telephone(a.getTelephone())
            .email(a.getEmail())
            .statut(a.getStatut().name())
            .type(a.getType().name())
            .adresse(a.getAdresse())
            .prime(a.getPrime())
            .dateDebut(a.getDateDebut())
            .dateFin(a.getDateFin())
            .beneficiaires(a.getBeneficiaires())
            .secteur(a.getSecteur())
            .employes(a.getEmployes())
            .assures(a.getAssures())
            .dateNaissance(a.getDateNaissance())
            .sexe(a.getSexe())
            .pieceIdentite(a.getPieceIdentite())
            .lien(a.getLien())
            .dateAdhesion(a.getDateAdhesion())
            .salaire(a.getSalaire())
            .garantie(a.getGarantie())
            .build();
    }
}
