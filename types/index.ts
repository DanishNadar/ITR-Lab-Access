export type LabState = "open" | "closed" | "limbo";

export interface LabRequest {
  id: string;
  name: string;
  email?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  projectPurpose?: string | null;
  tools?: string | null;
  peopleCount?: number | null;
  uses3DPrinter?: boolean | null;
  safetyTraining?: boolean | null;
  specialEquipment?: string | null;
  notes?: string | null;
  createdAt: string;
  status: "pending" | "approved" | "completed" | "cancelled";
}

export interface LabStatus {
  id: string;
  currentState: LabState;
  updatedAt: string;
  updatedBy: string;
  responsiblePerson?: string | null;
  notes?: string | null;
  formallyClosedAt?: string | null;
}

export interface CalendarEvent {
  summary: string;
  start: string;
  end: string;
  uid?: string;
}

export interface AvailabilityCalendar {
  id: string;
  personName: string;
  uploadedFileName: string;
  events: CalendarEvent[];
  createdAt: string;
}

export interface AvailabilityBlock {
  personName: string;
  start: string;
  end: string;
}

export type ScheduleBlockType =
  | "request"
  | "availability"
  | "open"
  | "closed"
  | "limbo"
  | "possible-limbo";

export interface ScheduleBlock {
  id: string;
  type: ScheduleBlockType;
  start: string;
  end: string;
  label: string;
  peopleInvolved?: string[];
  notes?: string | null;
}
