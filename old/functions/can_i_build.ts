import { Webpage } from "./interfaces";

export default function canIBuild(tab: Webpage, elem: string) {
    return tab.evaluateJavaScript<boolean>(`function() {
        return document.querySelector('[id^=main_buildlink_${elem}]:not([id$=cheap])').style.display != 'none';
    }`);
}