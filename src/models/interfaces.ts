// Copied from interfaces.ts
import type { activite, client, Commande, Compte, conges, facture, Fournisseur, minimizedProfessionModel, Notif, Offre, Produit, Profession, Transaction } from "./index";

export type userType = 'ADMIN' | 'SUPERADMIN' | 'USER';

export interface LoginR{
  token: string,
  user: {
    id: number,
    nom: string,
    email: string,
    role: userType,
    profession: minimizedProfessionModel
  },
  subscribed: boolean
}
export interface LoginResponse {
  success:boolean,
  data:LoginR,
  offlineMode?:boolean,
  message?:string
}

export interface detailledClient{
    id: number;
    nom: string;
    email: string;
    telephone: string;
    idEntreprise: number;
    commandes: {
        id:number,
        idClient:number,
        idProduit:number,
        quantite: number,
        valide: boolean,
        date: Date,
        datePaiement: Date,
        typePaiement: "CASH"|"CREDIT"|"CHECK",
        reference: string,
        factures:facture[],
        produit: Produit
    }[]
}

export interface CommandeResponse {
  id: number,
  idProduit: number,
  idClient: number,
  quantite: number,
  valide: boolean,
  date: Date,
  datePaiement: Date,
  reference?:string,
  factures: facture[],
  produit: Produit,
  client: client
}

export interface PostUser{
  nom:string,
  email:string,
  password:string,
  idProfession: number,
  role: userType
}

export interface AuthContextType {
  user: {
    token: string,
    user: {
      id: number,
      nom: string,
      email: string,
      role: userType,
      profession: minimizedProfessionModel
    },
    subscribed: boolean
  } | null;
  login: ((token: string, user: any) => Promise<void>) | null;
  logout: () => Promise<void>;
  offlineMode: boolean
}

export interface identifiedProduct {
  nom: string,
  numero: string,
  prixAchat: number
  // (truncated part as per document)
}

export interface ProductResponse{
  success: boolean,
  data?:Produit,
  message?:string
}

export type TypeConge = 'ANNUEL' | 'MALADIE' | 'MATERNITE' | 'PATERNITE' | 'SANS_SOLDE';

export interface NewConge {
  idUser: number;
  type: TypeConge;
  dateDebut: string; // Format ISO ou YYYY-MM-DD
  dateFin: string;   // Format ISO ou YYYY-MM-DD
  motif?: string;    // Justification optionnelle
}

export interface ResponseConge {
  success: boolean;
  message?: string;
  data?: any; // Ajuste ce type selon le retour (ex: Conge[] ou { employe: ..., conges: ..., solde: ... })
}

export interface CompteResultat {
  annee: string;
  chiffreAffaires: number;
  depenses:{
    achats: number;
    transport: number
  };
  margeBrute: number;
  margeBrutePourcentage: string;
  valeurAjoutee: number;
  ebe: number;
  resultatExploitation: number;
  resultatNet: number;
}

export interface BilanComptable {
  annee: string;
  actif: {
    stockValorise: number;
    creancesClients: number;
    creancesClientsDetail: {
      totalNonPaye: number;
      totalEnRetard: number;
      commandesNonPayees: Array<{ id: number; montant: number; retard: boolean }>;
    };
    tresorerie: number;
    totalActif: number;
  };
  passif: {
    dettesFournisseurs: number;
    capitauxPropres: number;
    totalPassif: number;
  };
}

export interface Bilan{
    
}

export interface FiStats{

}
export interface FinanceState {
  weekly: Bilan | null;
  monthly: Bilan | null;
  annually: Bilan | null;
  general: FiStats | null;
  account: Compte | null;
  transactions: Transaction[];

  // Nouveaux états
  compteResultat: CompteResultat | null;
  bilanComptable: BilanComptable | null;

  loading: boolean;
  error: string | null;
}

export interface NotifResponse{
  notifications: Notif[];
  unreadCount: number;
}

export interface BonCommande{
  fournisseur: Fournisseur;
  produit: Produit;
  paiement: "CASH" | "CREDIT";
  transport:number;
}