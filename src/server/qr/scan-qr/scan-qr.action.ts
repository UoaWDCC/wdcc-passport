"user server"

import { requireUser } from "@/lib/access";
import { scanQr } from "./scan-qr.service";

export async function scanQrAction(code: string) {
  const session = await requireUser();

  if(code.length > 6){
    code = code.slice(0, 6);
  }
  return scanQr(code, session.user.id);
}