import {Component} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {NgIf} from '@angular/common';

@Component({
    selector: 'app-nav',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, NgIf],
    templateUrl: './nav.html',
    styleUrl: './nav.scss'
})
export class Nav {
    expanded = false;

    toggleSidebar() {
        this.expanded = !this.expanded;
    }
}
