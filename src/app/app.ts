import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Nav } from './components/nav/nav';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Nav],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'financial-dashboard';
}
