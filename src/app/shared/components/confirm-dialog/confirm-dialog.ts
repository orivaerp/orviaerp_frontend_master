import { Component, inject } from '@angular/core';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
  readonly dialog = inject(ConfirmDialogService);

  respond(confirmed: boolean): void {
    this.dialog.respond(confirmed);
  }
}
