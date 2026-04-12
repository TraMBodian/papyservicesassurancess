import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { DataService } from "@/services/dataService";

export default function NewAssurePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    numero: "",
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    type: "FAMILLE",
    adresse: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await DataService.createAssure(formData);
      toast.success("Assuré créé avec succès !");
      navigate('/assures');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error("Erreur lors de la création de l'assuré : " + message);
    }
  };

  return (
    <AppLayout title="Nouvel assuré">
      <div className="w-full px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-full max-w-2xl space-y-4 sm:space-y-6">
            <Button variant="ghost" onClick={() => navigate('/assures')} className="mb-2 sm:mb-4 text-xs sm:text-sm px-2 sm:px-4">
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-2" /> Retour
            </Button>

            <Card className="p-3 sm:p-4 md:p-6">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
                <div>
                  <Label htmlFor="numero" className="text-xs sm:text-sm font-medium">Numéro</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => setFormData({...formData, numero: e.target.value})}
                    required
                    className="mt-1 sm:mt-2 text-xs sm:text-sm h-9 sm:h-10"
                    placeholder="ASS-2024-001"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
                  <div>
                    <Label htmlFor="nom" className="text-xs sm:text-sm font-medium">Nom</Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) => setFormData({...formData, nom: e.target.value})}
                      required
                      className="mt-1 sm:mt-2 text-xs sm:text-sm h-9 sm:h-10"
                      placeholder="Diop"
                    />
                  </div>
                  <div>
                    <Label htmlFor="prenom" className="text-xs sm:text-sm font-medium">Prénom</Label>
                    <Input
                      id="prenom"
                      value={formData.prenom}
                      onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                      required
                      className="mt-1 sm:mt-2 text-xs sm:text-sm h-9 sm:h-10"
                      placeholder="Moussa"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
                  <div>
                    <Label htmlFor="telephone" className="text-xs sm:text-sm font-medium">Téléphone</Label>
                    <Input
                      id="telephone"
                      type="tel"
                      value={formData.telephone}
                      onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                      required
                      className="mt-1 sm:mt-2 text-xs sm:text-sm h-9 sm:h-10"
                      placeholder="+221771234567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-xs sm:text-sm font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="mt-1 sm:mt-2 text-xs sm:text-sm h-9 sm:h-10"
                      placeholder="moussa.diop@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
                  <div>
                    <Label htmlFor="type" className="text-xs sm:text-sm font-medium">Type</Label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      required
                      className="mt-1 sm:mt-2 w-full px-3 sm:px-4 py-2 text-xs sm:text-sm h-9 sm:h-10 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="FAMILLE">Famille</option>
                      <option value="GROUPE">Groupe</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="adresse" className="text-xs sm:text-sm font-medium">Adresse</Label>
                    <Input
                      id="adresse"
                      value={formData.adresse}
                      onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                      className="mt-1 sm:mt-2 text-xs sm:text-sm h-9 sm:h-10"
                      placeholder="Dakar, Sénégal"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                  <Button type="submit" className="flex-1 h-9 sm:h-10 text-xs sm:text-sm font-medium">
                    Créer l'assuré
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/assures')}
                    className="flex-1 sm:flex-none h-9 sm:h-10 text-xs sm:text-sm"
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
