export interface Role {
  id?: string;
  name: string;
  year: number;
  description?: string;
  created_at?: string;
  permissions?: PermissionMatrix;
}

export interface PermissionMatrix {
  [module: string]: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
}
