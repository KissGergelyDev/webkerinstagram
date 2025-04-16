export interface User {
    id?: string;
    username: string;
    email: string;
    password_hashed: string;  //egyelőre nem hashed
    profilePicture?: string;  //nem kell megadni
}