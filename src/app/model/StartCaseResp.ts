import {Suspect} from "@/app/play/components/SuspectCard";
import {CaseFileData} from "@/app/play/components/CaseFile";

export type StartCaseResp = {
  caseId: string;
  suspects: Suspect[];
  background: CaseFileData;
  clues: string[];

}