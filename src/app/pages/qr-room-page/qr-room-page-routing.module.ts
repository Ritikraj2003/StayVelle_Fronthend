import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QRHomePageComponent } from './qrhome-page/qrhome-page.component';
import { QRCategorypageComponent } from './qrcategorypage/qrcategorypage.component';

const routes: Routes = [
    {
        path: '',
        component: QRHomePageComponent
    },
    {
        path: 'category',
        component: QRCategorypageComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class QrRoomPageRoutingModule { }
