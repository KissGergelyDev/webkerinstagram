import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-like-counter',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './like-counter.component.html',
  styleUrls: ['./like-counter.component.scss']
})
export class LikeCounterComponent {
  @Input() postId!: string;
  @Input() likeCount: number = 0;
  @Input() isLiked: boolean = false;

  @Output() likeClicked = new EventEmitter<string>();
  @Output() hoverStarted = new EventEmitter<void>();
  @Output() hoverEnded = new EventEmitter<void>();

  onLikeClick() {
    this.likeClicked.emit(this.postId);
  }
}