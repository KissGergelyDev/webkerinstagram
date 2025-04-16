import { Post } from './Post';
import { Like } from './Like';

export interface PostWithLikes extends Post {
  likes: Like[];
  likeCount: number;
}