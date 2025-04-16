import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-like-counter',
  standalone: true,
  imports: [MatIconModule, MatButtonModule], // Itt adjuk hozzá a szükséges modulokat
  templateUrl: './like-counter.component.html',
  styleUrls: ['./like-counter.component.scss']
})
export class LikeCounterComponent {
  @Input() postId!: string;
  @Input() likeCount: number = 0;
  @Input() isLiked: boolean = false;
  
  @Output() likeClicked = new EventEmitter<string>();

  onLikeClick() {
    this.likeClicked.emit(this.postId);
  }
}