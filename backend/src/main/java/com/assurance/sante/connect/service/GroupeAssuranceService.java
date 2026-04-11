package com.assurance.sante.connect.service;

import com.assurance.sante.connect.entity.GroupeAssurance;
import com.assurance.sante.connect.exception.ResourceNotFoundException;
import com.assurance.sante.connect.repository.GroupeAssuranceRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GroupeAssuranceService {

    private final GroupeAssuranceRepository repository;
    private final ObjectMapper objectMapper;

    public List<GroupeAssurance> getAll() {
        return repository.findAll();
    }

    public GroupeAssurance getById(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Groupe non trouvé : " + id));
    }

    public GroupeAssurance create(Map<String, Object> data) {
        GroupeAssurance g = buildFromMap(new GroupeAssurance(), data);
        return repository.save(g);
    }

    public GroupeAssurance update(Long id, Map<String, Object> data) {
        GroupeAssurance g = getById(id);
        buildFromMap(g, data);
        return repository.save(g);
    }

    public void delete(Long id) {
        repository.delete(getById(id));
    }

    private GroupeAssurance buildFromMap(GroupeAssurance g, Map<String, Object> data) {
        if (data.containsKey("entreprise"))     g.setEntreprise((String) data.get("entreprise"));
        if (data.containsKey("secteur"))        g.setSecteur((String) data.get("secteur"));
        if (data.containsKey("debut"))          g.setDebut((String) data.get("debut"));
        if (data.containsKey("dureeGarantie"))  g.setDureeGarantie((String) data.get("dureeGarantie"));
        if (data.containsKey("prime"))          g.setPrime((String) data.get("prime"));
        if (data.containsKey("primeNette"))     g.setPrimeNette((String) data.get("primeNette"));
        if (data.containsKey("taxes"))          g.setTaxes((String) data.get("taxes"));
        if (data.containsKey("employes")) {
            Object v = data.get("employes");
            g.setEmployes(v instanceof Integer ? (Integer) v : Integer.parseInt(v.toString()));
        }
        if (data.containsKey("assures")) {
            Object v = data.get("assures");
            g.setAssures(v instanceof Integer ? (Integer) v : Integer.parseInt(v.toString()));
        }
        if (data.containsKey("echeanceAuto")) {
            Object v = data.get("echeanceAuto");
            g.setEcheanceAuto(v instanceof Boolean ? (Boolean) v : Boolean.parseBoolean(v.toString()));
        }
        if (data.containsKey("statut")) {
            try { g.setStatut(GroupeAssurance.StatutContrat.valueOf(
                    data.get("statut").toString().toUpperCase())); } catch (Exception ignored) {}
        }
        // Sérialiser la liste des membres/employés en JSON
        // Accepter les deux clés : "employesDetail" (ancien) et "membresDetail" (nouveau)
        Object detail = data.containsKey("employesDetail") ? data.get("employesDetail")
                      : data.containsKey("membresDetail")  ? data.get("membresDetail")
                      : null;
        if (detail != null) {
            try {
                g.setEmployesDetail(objectMapper.writeValueAsString(detail));
            } catch (JsonProcessingException ignored) {}
        }
        return g;
    }
}
