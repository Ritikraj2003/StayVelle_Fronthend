import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QRHomePageComponent } from './qrhome-page/qrhome-page.component';
import { QRCategorypageComponent } from './qrcategorypage/qrcategorypage.component';
import { QrPinValidationpageComponent } from './qr-pin-validationpage/qr-pin-validationpage.component';

const routes: Routes = [
    {
        path: '',
        component: QrPinValidationpageComponent
    },
    {
        path: 'homepage',
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
