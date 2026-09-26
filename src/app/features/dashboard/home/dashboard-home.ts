import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Icon } from '../../../shared/components/icon/icon';

@Component({
  selector: 'app-dashboard-home',
  imports: [Icon],
  templateUrl: './dashboard-home.html',
})
export class DashboardHome {
  readonly today = new Date().toISOString().slice(0, 10);

  constructor(readonly authService: AuthService) {}
}
