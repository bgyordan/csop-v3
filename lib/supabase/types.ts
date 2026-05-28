export type Role = 'admin' | 'secretary' | 'viewer';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: Role;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          role?: Role;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: Role;
          created_at?: string;
        };
      };
      incoming: {
        Row: {
          id: string;
          number: string;
          date: string;
          from_whom: string;
          subject: string;
          description: string;
          file_url: string;
          file_name: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          number: string;
          date: string;
          from_whom: string;
          subject: string;
          description?: string;
          file_url?: string;
          file_name?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          number?: string;
          date?: string;
          from_whom?: string;
          subject?: string;
          description?: string;
          file_url?: string;
          file_name?: string;
          created_by?: string | null;
          created_at?: string;
        };
      };
      outgoing: {
        Row: {
          id: string;
          number: string;
          date: string;
          to_whom: string;
          subject: string;
          description: string;
          file_url: string;
          file_name: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          number: string;
          date: string;
          to_whom: string;
          subject: string;
          description?: string;
          file_url?: string;
          file_name?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          number?: string;
          date?: string;
          to_whom?: string;
          subject?: string;
          description?: string;
          file_url?: string;
          file_name?: string;
          created_by?: string | null;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          number: string;
          date: string;
          title: string;
          description: string;
          file_url: string;
          file_name: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          number: string;
          date: string;
          title: string;
          description?: string;
          file_url?: string;
          file_name?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          number?: string;
          date?: string;
          title?: string;
          description?: string;
          file_url?: string;
          file_name?: string;
          created_by?: string | null;
          created_at?: string;
        };
      };
      contracts: {
        Row: {
          id: string;
          number: string;
          date: string;
          counterparty: string;
          subject: string;
          start_date: string | null;
          end_date: string | null;
          description: string;
          file_url: string;
          file_name: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          number: string;
          date: string;
          counterparty: string;
          subject: string;
          start_date?: string | null;
          end_date?: string | null;
          description?: string;
          file_url?: string;
          file_name?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          number?: string;
          date?: string;
          counterparty?: string;
          subject?: string;
          start_date?: string | null;
          end_date?: string | null;
          description?: string;
          file_url?: string;
          file_name?: string;
          created_by?: string | null;
          created_at?: string;
        };
      };
    };
  };
};

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Incoming = Database['public']['Tables']['incoming']['Row'];
export type Outgoing = Database['public']['Tables']['outgoing']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type Contract = Database['public']['Tables']['contracts']['Row'];

export type RegisterType = 'incoming' | 'outgoing' | 'orders' | 'contracts';

export const REGISTER_LABELS: Record<RegisterType, string> = {
  incoming: 'Регистър-входящи',
  outgoing: 'Регистър-изходящи',
  orders: 'Заповеди',
  contracts: 'Договори',
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Администратор',
  secretary: 'Секретар',
  viewer: 'Читател',
};
