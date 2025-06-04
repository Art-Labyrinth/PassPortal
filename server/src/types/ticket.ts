export enum TicketType {
  GUEST = 'G',
  MASTER = 'M',
  VOLUNTEER = 'V',
  ORGS = 'O',
  FAMILY = 'S',
  FRIENDS = 'F',
  CASH = 'C',
  PREFERENTIAL = 'L'
}

export enum TicketStatus {
  PAID = 'PAID',
  UNPAID = 'UNPAID',
  USED = 'USED',
  INACTIVE = 'INACTIVE'
}

export interface Ticket {
  id: string;
  name: string;
  status: TicketStatus;
  comment?: string;
  uuid: string;
  phone?: string;
  email?: string;
  purchase_date: Date | null | string;
  verification_date?: Date | null | string;
}
export interface TicketStats {
  total: number;
  paid: number;
  unpaid: number;
  used: number;
  inactive: number;
}

export interface TicketCreationParams {
  type: TicketType;
  name: string;
  status?: TicketStatus;
  comment?: string;
  phone?: string;
  email?: string;
}
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface TicketVerificationResult {
  success: boolean;
  message: string;
  ticket?: Ticket;
}
