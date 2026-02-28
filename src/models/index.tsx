export interface UserLoginData {
    success: true,
    data: {
        token: string,
        user: UserAfterLoginData
    },
    message: string
}

export interface UserAfterLoginData {
    id: 0,
    nom: string,
    email: string,
    mdp: string,
    idProfession: 0,
    role: "ADMIN" | "SUPERADMIN" | "USER",
    profession: {
        poste: string
    },
    entreprise: {
        id: 0,
        nom: string
    }
}

export interface Entreprise {
    id: number,
    nom: string,
    email: string,
    activite: string,
    ref: string,
    idCompte: number
}