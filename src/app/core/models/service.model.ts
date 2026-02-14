export interface ServiceDocument {
    documentId: number;
    entityType: string;
    entityId: number;
    documentType: string;
    fileName: string;
    description: string | null;
    filePath: string;
    isPrimary: boolean;
    file: any | null;
}

export interface Service {
    serviceId: number;
    serviceCategory: string;
    subCategory: string;
    serviceName: string;
    price: number;
    unit: string;
    isComplementary: boolean;
    isActive: boolean;
    documents: ServiceDocument[];
    createdBy: string;
    createdOn: string;
    modifiedBy: string;
    modifiedOn: string | null;
}
