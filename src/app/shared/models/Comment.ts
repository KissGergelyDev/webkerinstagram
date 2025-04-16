export interface Comment {
    id: string;
    postId: string;        // Melyik poszthoz tartozik
    authorId: string;      // Ki írta
    content: string;       // A komment tartalma
    createdAt?: Date;      // Létrehozás időpontja
    updatedAt?: Date;      // Módosítás időpontja
}