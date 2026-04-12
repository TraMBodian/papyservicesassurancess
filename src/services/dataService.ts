// Data service - connecté au backend Spring Boot, avec fallback données de démo
import { apiClient } from './apiClient';
import {
  MOCK_ASSURES, MOCK_POLICES, MOCK_SINISTRES, MOCK_PRESTATAIRES,
  MOCK_CONSULTATIONS, MOCK_PRESCRIPTIONS, MOCK_REMBOURSEMENTS,
  MOCK_USERS, MOCK_CARTES,
} from './mockData';

async function withFallback<T>(apiCall: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await apiCall();
  } catch {
    return fallback;
  }
}

export class DataService {

  // Assurés
  static async getAssures() {
    return withFallback(async () => {
      const r = await apiClient.getAssures();
      return r.assures;
    }, MOCK_ASSURES);
  }

  static async getAssureById(id: string) {
    return withFallback(
      () => apiClient.getAssureById(id),
      MOCK_ASSURES.find(a => String(a.id) === id) ?? null
    );
  }

  static async createAssure(data: any) {
    return apiClient.createAssure(data);
  }

  static async updateAssure(id: string, data: any) {
    return apiClient.updateAssure(id, data);
  }

  static async deleteAssure(id: string) {
    return apiClient.deleteAssure(id);
  }

  // Polices
  static async getPolices() {
    return withFallback(async () => {
      const r = await apiClient.getPolices();
      return r.polices;
    }, MOCK_POLICES);
  }

  static async createPolice(data: any) {
    return apiClient.createPolice(data);
  }

  static async updatePolice(id: string, data: any) {
    return apiClient.updatePolice(id, data);
  }

  static async deletePolice(id: string) {
    return apiClient.deletePolice(id);
  }

  // Sinistres
  static async getSinistres() {
    return withFallback(async () => {
      const r = await apiClient.getSinistres();
      return r.sinistres;
    }, MOCK_SINISTRES);
  }

  static async getSinistreById(id: string) {
    return withFallback(
      () => apiClient.getSinistreById(id),
      MOCK_SINISTRES.find(s => String(s.id) === id) ?? null
    );
  }

  static async createSinistre(data: any) {
    return apiClient.createSinistre(data);
  }

  // Prestataires
  static async getPrestataires() {
    return withFallback(async () => {
      const r = await apiClient.getPrestataires();
      return r.prestataires;
    }, MOCK_PRESTATAIRES);
  }

  static async createPrestataire(data: any) {
    return apiClient.createPrestataire(data);
  }

  // Consultations
  static async getConsultations() {
    return withFallback(async () => {
      const r = await apiClient.getConsultations();
      return r.consultations;
    }, MOCK_CONSULTATIONS);
  }

  static async createConsultation(data: any) {
    return apiClient.createConsultation(data);
  }

  // Prescriptions
  static async getPrescriptions() {
    return withFallback(async () => {
      const r = await apiClient.getPrescriptions();
      return r.prescriptions;
    }, MOCK_PRESCRIPTIONS);
  }

  static async createPrescription(data: any) {
    return apiClient.createPrescription(data);
  }

  // Remboursements
  static async getRemboursements() {
    return withFallback(async () => {
      const r = await apiClient.getRemboursements();
      return r.remboursements;
    }, MOCK_REMBOURSEMENTS);
  }

  // Cartes
  static async getCartes() {
    return withFallback(async () => {
      const r = await apiClient.getCartes();
      return r.cartes;
    }, MOCK_CARTES);
  }

  // Users
  static async getUsers() {
    return withFallback(async () => {
      const r = await apiClient.getUsers();
      return r.users;
    }, MOCK_USERS);
  }

  static async updateUser(id: string, data: any) {
    return apiClient.updateUser(id, data);
  }

  static async deleteUser(id: string) {
    return apiClient.deleteUser(id);
  }

  // Familles
  static async getFamilles() {
    return withFallback(async () => {
      const res = await apiClient.getFamilles();
      return Array.isArray(res) ? res : (res as any)?.data ?? [];
    }, []);
  }

  static async createFamille(data: any) {
    const res = await apiClient.createFamille(data);
    return (res as any)?.data ?? res;
  }

  static async updateFamille(id: number, data: any) {
    const res = await apiClient.updateFamille(id, data);
    return (res as any)?.data ?? res;
  }

  static async deleteFamille(id: number) {
    return apiClient.deleteFamille(id);
  }

  static async getFamilleById(id: number) {
    const res = await apiClient.getFamilleById(id);
    return (res as any)?.data ?? res;
  }

  // Groupes
  static async getGroupes() {
    return withFallback(async () => {
      const res = await apiClient.getGroupes();
      return Array.isArray(res) ? res : (res as any)?.data ?? [];
    }, []);
  }

  static async createGroupe(data: any) {
    const res = await apiClient.createGroupe(data);
    return (res as any)?.data ?? res;
  }

  static async updateGroupe(id: number, data: any) {
    const res = await apiClient.updateGroupe(id, data);
    return (res as any)?.data ?? res;
  }

  static async deleteGroupe(id: number) {
    return apiClient.deleteGroupe(id);
  }

  static async getGroupeById(id: number) {
    const res = await apiClient.getGroupeById(id);
    return (res as any)?.data ?? res;
  }
}
