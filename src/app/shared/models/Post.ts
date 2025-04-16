export interface Post {
    id: string;
    authorId: string;
    imageUrl: string;
    caption?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }