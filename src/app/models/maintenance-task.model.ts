export interface MaintenanceTask {
  taskId?: number;
  bookingId?: number;
  roomId: number;
  taskStatus: string;
  taskType: string;
  assignedToUserId?: number;
  roomImage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

