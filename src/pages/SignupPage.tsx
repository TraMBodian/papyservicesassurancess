import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stethoscope, Users, Mail, Phone, MapPin, Eye, EyeOff } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useAuth, UserRole } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

const SignupPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp } = useAuth();
  const [searchParams] = useSearchParams();

  const urlRole = searchParams.get('role') as UserRole;
  const initialRole: UserRole = urlRole === 'prestataire' ? 'prestataire' : 'client';

  const [role, setRole] = useState<UserRole>(initialRole);
  const [contactMode, setContactMode] = useState<'email' | 'telephone'>('email');
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [adresse, setAdresse] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cgAccepted, setCgAccepted] = useState(false);

  const roles: { value: UserRole; label: string; description: string; icon: React.ReactNode }[] = [
    { value: 'prestataire', label: 'Prestataire', description: 'Hôpital, clinique, pharmacie…', icon: <Stethoscope className="w-5 h-5" /> },
    { value: 'client',      label: 'Client',      description: 'Assuré',                        icon: <Users className="w-5 h-5" /> },
  ];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation contact
    if (contactMode === 'email' && !email.trim()) {
      toast({ title: "Erreur", description: "Veuillez entrer votre adresse email", variant: "destructive" });
      return;
    }
    if (contactMode === 'telephone' && !telephone.trim()) {
      toast({ title: "Erreur", description: "Veuillez entrer votre numéro de téléphone", variant: "destructive" });
      return;
    }

    // Localisation obligatoire pour prestataire
    if (role === 'prestataire' && !adresse.trim()) {
      toast({ title: "Erreur", description: "La localisation est obligatoire pour les prestataires", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Erreur", description: "Le mot de passe doit contenir au moins 8 caractères", variant: "destructive" });
      return;
    }
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      toast({ title: "Erreur", description: "Le mot de passe doit contenir au moins une majuscule et un chiffre", variant: "destructive" });
      return;
    }
    if (!fullName.trim()) {
      toast({ title: "Erreur", description: "Le nom complet est requis", variant: "destructive" });
      return;
    }
    if (!cgAccepted) {
      toast({ title: "Conditions requises", description: "Vous devez accepter les Conditions Générales pour continuer", variant: "destructive" });
      return;
    }

    // Si inscription par téléphone uniquement → email placeholder pour le backend
    const finalEmail = contactMode === 'email'
      ? email.trim()
      : `TEL_${telephone.replace(/\s/g, '')}@noemail.local`;

    setLoading(true);
    try {
      await signUp(finalEmail, password, role, fullName, organization, telephone, adresse);
      toast({ title: "Compte créé avec succès !", description: "Bienvenue !" });
      navigate('/dashboard');
    } catch (error: any) {
      toast({ title: "Erreur d'inscription", description: error.message || "Une erreur est survenue", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#E8F4F8' }}>
      <Card className="w-full max-w-2xl p-8 shadow-2xl">
        {/* En-tête */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo1.png" alt="Logo" className="w-16 h-16 object-contain mb-4" />
          <h1 className="text-3xl font-bold">Créer un compte</h1>
          <p className="text-gray-600 mt-2">Rejoignez Papy Services Assurances</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">

          {/* Sélection du rôle */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Vous êtes</Label>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    role === r.value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={role === r.value ? 'text-blue-600' : 'text-gray-500'}>{r.icon}</span>
                    <span className="font-semibold text-sm">{r.label}</span>
                  </div>
                  <p className="text-xs text-gray-500">{r.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Nom complet */}
          <div>
            <Label htmlFor="fullName">Nom complet <span className="text-red-500">*</span></Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Prénom Nom"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="mt-2"
            />
          </div>

          {/* Organisation (prestataire) */}
          {role === 'prestataire' && (
            <div>
              <Label htmlFor="organization">Organisation / Établissement</Label>
              <Input
                id="organization"
                type="text"
                placeholder="Ex : Clinique Pasteur, Pharmacie du Centre…"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="mt-2"
              />
            </div>
          )}

          {/* Contact : Email ou Téléphone */}
          <div>
            <Label className="mb-2 block">
              Moyen de contact <span className="text-red-500">*</span>
            </Label>

            {/* Toggle Email / Téléphone */}
            <div className="flex rounded-lg border border-input overflow-hidden mb-3">
              <button
                type="button"
                onClick={() => setContactMode('email')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
                  contactMode === 'email' ? 'bg-blue-600 text-white' : 'bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                <Mail size={15} />
                Adresse email
              </button>
              <button
                type="button"
                onClick={() => setContactMode('telephone')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
                  contactMode === 'telephone' ? 'bg-blue-600 text-white' : 'bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                <Phone size={15} />
                Numéro de téléphone
              </button>
            </div>

            {contactMode === 'email' ? (
              <Input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            ) : (
              <Input
                type="tel"
                placeholder="Ex : +221 77 000 00 00"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                disabled={loading}
              />
            )}

            {contactMode === 'telephone' && (
              <p className="text-xs text-amber-600 mt-1.5">
                ⚠ Sans email, la connexion se fera uniquement via l'administration.
              </p>
            )}
          </div>

          {/* Localisation — obligatoire pour prestataires */}
          {role === 'prestataire' && (
            <div>
              <Label htmlFor="adresse" className="flex items-center gap-1">
                <MapPin size={14} />
                Localisation <span className="text-red-500">*</span>
              </Label>
              <Input
                id="adresse"
                type="text"
                placeholder="Ex : Rue 10, Quartier Médina, Dakar"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                required
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">Adresse complète de votre établissement</p>
            </div>
          )}

          {/* Mot de passe */}
          <div>
            <Label htmlFor="password">Mot de passe <span className="text-red-500">*</span></Label>
            <div className="relative mt-2">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Au moins 8 caractères, une majuscule et un chiffre</p>
          </div>

          {/* Confirmer mot de passe */}
          <div>
            <Label htmlFor="confirmPassword">Confirmer le mot de passe <span className="text-red-500">*</span></Label>
            <div className="relative mt-2">
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Acceptation des conditions générales */}
          <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
            <input
              id="cgAccepted"
              type="checkbox"
              checked={cgAccepted}
              onChange={(e) => setCgAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer flex-shrink-0"
            />
            <label htmlFor="cgAccepted" className="text-sm text-gray-700 cursor-pointer leading-snug">
              J'ai lu et j'accepte les{" "}
              <button
                type="button"
                onClick={() => navigate('/conditions-generales')}
                className="text-blue-600 hover:underline font-semibold"
              >
                Conditions Générales d'Assurance
              </button>{" "}
              de Papy Services Assurances. <span className="text-red-500">*</span>
            </label>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !cgAccepted}
          >
            {loading ? "Création en cours..." : "Créer mon compte"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Déjà un compte ?{" "}
            <button onClick={() => navigate("/login")} className="text-blue-600 hover:underline font-semibold">
              Se connecter
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default SignupPage;
