export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      access_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip: string | null
          role: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip?: string | null
          role?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip?: string | null
          role?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      aluno_responsaveis: {
        Row: {
          aluno_id: string
          created_at: string
          e_titular_financeiro: boolean
          id: string
          pode_checkin: boolean
          responsavel_id: string
          tipo_relacao: string
        }
        Insert: {
          aluno_id: string
          created_at?: string
          e_titular_financeiro?: boolean
          id?: string
          pode_checkin?: boolean
          responsavel_id: string
          tipo_relacao?: string
        }
        Update: {
          aluno_id?: string
          created_at?: string
          e_titular_financeiro?: boolean
          id?: string
          pode_checkin?: boolean
          responsavel_id?: string
          tipo_relacao?: string
        }
        Relationships: [
          {
            foreignKeyName: "aluno_responsaveis_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aluno_responsaveis_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
        ]
      }
      alunos: {
        Row: {
          cod_postal: string | null
          created_at: string
          data_matricula: string
          data_nascimento: string
          email: string
          enc_pagamento: string | null
          faixa: Database["public"]["Enums"]["belt_type"]
          frequencia: number
          genero: Database["public"]["Enums"]["genero_type"] | null
          grau: number
          id: string
          metodo_pagamento: Database["public"]["Enums"]["payment_method"]
          morada: string | null
          nif: string | null
          nome: string
          numerario_aprovado: boolean
          numerario_aprovado_por: string | null
          plano_id: string | null
          plano_nome: string | null
          profile_id: string | null
          responsavel: string | null
          responsavel_email: string | null
          responsavel_nif: string | null
          responsavel_tel: string | null
          status: Database["public"]["Enums"]["aluno_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          telefone: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          cod_postal?: string | null
          created_at?: string
          data_matricula?: string
          data_nascimento: string
          email: string
          enc_pagamento?: string | null
          faixa?: Database["public"]["Enums"]["belt_type"]
          frequencia?: number
          genero?: Database["public"]["Enums"]["genero_type"] | null
          grau?: number
          id?: string
          metodo_pagamento?: Database["public"]["Enums"]["payment_method"]
          morada?: string | null
          nif?: string | null
          nome: string
          numerario_aprovado?: boolean
          numerario_aprovado_por?: string | null
          plano_id?: string | null
          plano_nome?: string | null
          profile_id?: string | null
          responsavel?: string | null
          responsavel_email?: string | null
          responsavel_nif?: string | null
          responsavel_tel?: string | null
          status?: Database["public"]["Enums"]["aluno_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          telefone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          cod_postal?: string | null
          created_at?: string
          data_matricula?: string
          data_nascimento?: string
          email?: string
          enc_pagamento?: string | null
          faixa?: Database["public"]["Enums"]["belt_type"]
          frequencia?: number
          genero?: Database["public"]["Enums"]["genero_type"] | null
          grau?: number
          id?: string
          metodo_pagamento?: Database["public"]["Enums"]["payment_method"]
          morada?: string | null
          nif?: string | null
          nome?: string
          numerario_aprovado?: boolean
          numerario_aprovado_por?: string | null
          plano_id?: string | null
          plano_nome?: string | null
          profile_id?: string | null
          responsavel?: string | null
          responsavel_email?: string | null
          responsavel_nif?: string | null
          responsavel_tel?: string | null
          status?: Database["public"]["Enums"]["aluno_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          telefone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alunos_numerario_aprovado_por_fkey"
            columns: ["numerario_aprovado_por"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alunos_numerario_aprovado_por_fkey"
            columns: ["numerario_aprovado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alunos_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alunos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alunos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      aulas: {
        Row: {
          created_at: string
          data: string
          hora_fim: string | null
          hora_inicio: string | null
          horario: string | null
          id: string
          professor_id: string | null
          professor_nome: string | null
          sala: string | null
          status: string
          turma_id: string
          turma_nome: string
        }
        Insert: {
          created_at?: string
          data: string
          hora_fim?: string | null
          hora_inicio?: string | null
          horario?: string | null
          id?: string
          professor_id?: string | null
          professor_nome?: string | null
          sala?: string | null
          status?: string
          turma_id: string
          turma_nome: string
        }
        Update: {
          created_at?: string
          data?: string
          hora_fim?: string | null
          hora_inicio?: string | null
          horario?: string | null
          id?: string
          professor_id?: string | null
          professor_nome?: string | null
          sala?: string | null
          status?: string
          turma_id?: string
          turma_nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "aulas_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aulas_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aulas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          dados: Json
          secao: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          dados?: Json
          secao: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          dados?: Json
          secao?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "configuracoes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          aceita_contrato: boolean
          aceita_imagem: boolean
          aceita_rgpd: boolean
          aluno_id: string
          aluno_nif: string | null
          aluno_nome: string
          assinado: boolean
          assinatura_img: string | null
          created_at: string
          data_assinatura: string | null
          data_fim: string | null
          data_inicio: string
          enc_pagamento: string | null
          id: string
          plano_id: string | null
          plano_nome: string | null
          status: Database["public"]["Enums"]["contrato_status"]
          valor: number
        }
        Insert: {
          aceita_contrato?: boolean
          aceita_imagem?: boolean
          aceita_rgpd?: boolean
          aluno_id: string
          aluno_nif?: string | null
          aluno_nome: string
          assinado?: boolean
          assinatura_img?: string | null
          created_at?: string
          data_assinatura?: string | null
          data_fim?: string | null
          data_inicio?: string
          enc_pagamento?: string | null
          id?: string
          plano_id?: string | null
          plano_nome?: string | null
          status?: Database["public"]["Enums"]["contrato_status"]
          valor: number
        }
        Update: {
          aceita_contrato?: boolean
          aceita_imagem?: boolean
          aceita_rgpd?: boolean
          aluno_id?: string
          aluno_nif?: string | null
          aluno_nome?: string
          assinado?: boolean
          assinatura_img?: string | null
          created_at?: string
          data_assinatura?: string | null
          data_fim?: string | null
          data_inicio?: string
          enc_pagamento?: string | null
          id?: string
          plano_id?: string | null
          plano_nome?: string | null
          status?: Database["public"]["Enums"]["contrato_status"]
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contratos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      graduacoes: {
        Row: {
          aluno_id: string
          aluno_nome: string
          created_at: string
          data: string
          faixa_anterior: Database["public"]["Enums"]["belt_type"]
          faixa_nova: Database["public"]["Enums"]["belt_type"]
          grau_anterior: number
          grau_novo: number
          id: string
          notificado_wa: boolean
          observacao: string | null
          professor_id: string | null
          professor_nome: string | null
        }
        Insert: {
          aluno_id: string
          aluno_nome: string
          created_at?: string
          data?: string
          faixa_anterior: Database["public"]["Enums"]["belt_type"]
          faixa_nova: Database["public"]["Enums"]["belt_type"]
          grau_anterior: number
          grau_novo: number
          id?: string
          notificado_wa?: boolean
          observacao?: string | null
          professor_id?: string | null
          professor_nome?: string | null
        }
        Update: {
          aluno_id?: string
          aluno_nome?: string
          created_at?: string
          data?: string
          faixa_anterior?: Database["public"]["Enums"]["belt_type"]
          faixa_nova?: Database["public"]["Enums"]["belt_type"]
          grau_anterior?: number
          grau_novo?: number
          id?: string
          notificado_wa?: boolean
          observacao?: string | null
          professor_id?: string | null
          professor_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "graduacoes_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graduacoes_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graduacoes_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens: {
        Row: {
          agendado_para: string | null
          assunto: string | null
          canal: Database["public"]["Enums"]["msg_canal"]
          corpo: string
          created_at: string
          enviado_em: string | null
          id: string
          para_id: string
          para_nome: string
          remetente: string
          status: Database["public"]["Enums"]["msg_status"]
        }
        Insert: {
          agendado_para?: string | null
          assunto?: string | null
          canal: Database["public"]["Enums"]["msg_canal"]
          corpo: string
          created_at?: string
          enviado_em?: string | null
          id?: string
          para_id: string
          para_nome: string
          remetente: string
          status?: Database["public"]["Enums"]["msg_status"]
        }
        Update: {
          agendado_para?: string | null
          assunto?: string | null
          canal?: Database["public"]["Enums"]["msg_canal"]
          corpo?: string
          created_at?: string
          enviado_em?: string | null
          id?: string
          para_id?: string
          para_nome?: string
          remetente?: string
          status?: Database["public"]["Enums"]["msg_status"]
        }
        Relationships: []
      }
      mensagens_chat: {
        Row: {
          aluno_id: string
          corpo: string
          created_at: string
          id: string
          lida: boolean
          lida_em: string | null
          remetente_id: string | null
          remetente_role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          aluno_id: string
          corpo: string
          created_at?: string
          id?: string
          lida?: boolean
          lida_em?: string | null
          remetente_id?: string | null
          remetente_role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          aluno_id?: string
          corpo?: string
          created_at?: string
          id?: string
          lida?: boolean
          lida_em?: string | null
          remetente_id?: string | null
          remetente_role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_chat_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_chat_remetente_id_fkey"
            columns: ["remetente_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_chat_remetente_id_fkey"
            columns: ["remetente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          corpo: string
          created_at: string
          id: string
          lida: boolean
          link: string | null
          profile_id: string
          tipo: string
          titulo: string
        }
        Insert: {
          corpo: string
          created_at?: string
          id?: string
          lida?: boolean
          link?: string | null
          profile_id: string
          tipo?: string
          titulo: string
        }
        Update: {
          corpo?: string
          created_at?: string
          id?: string
          lida?: boolean
          link?: string | null
          profile_id?: string
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          aluno_id: string
          aluno_nome: string
          created_at: string
          data_pagamento: string | null
          descricao: string | null
          id: string
          metodo: Database["public"]["Enums"]["payment_method"] | null
          plano_id: string | null
          plano_nome: string | null
          status: Database["public"]["Enums"]["payment_status"]
          stripe_invoice_id: string | null
          stripe_payment_id: string | null
          toc_numero: string | null
          valor: number
          vencimento: string
        }
        Insert: {
          aluno_id: string
          aluno_nome: string
          created_at?: string
          data_pagamento?: string | null
          descricao?: string | null
          id?: string
          metodo?: Database["public"]["Enums"]["payment_method"] | null
          plano_id?: string | null
          plano_nome?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_invoice_id?: string | null
          stripe_payment_id?: string | null
          toc_numero?: string | null
          valor: number
          vencimento: string
        }
        Update: {
          aluno_id?: string
          aluno_nome?: string
          created_at?: string
          data_pagamento?: string | null
          descricao?: string | null
          id?: string
          metodo?: Database["public"]["Enums"]["payment_method"] | null
          plano_id?: string | null
          plano_nome?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_invoice_id?: string | null
          stripe_payment_id?: string | null
          toc_numero?: string | null
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_numerario: {
        Row: {
          aluno_id: string | null
          aprovado_em: string | null
          aprovado_por: string | null
          created_at: string
          email: string
          id: string
          nome_aluno: string
          nota_admin: string | null
          plano_id: string | null
          plano_nome: string | null
          status: string
          telefone: string | null
          valor: number | null
        }
        Insert: {
          aluno_id?: string | null
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          email: string
          id?: string
          nome_aluno: string
          nota_admin?: string | null
          plano_id?: string | null
          plano_nome?: string | null
          status?: string
          telefone?: string | null
          valor?: number | null
        }
        Update: {
          aluno_id?: string | null
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          email?: string
          id?: string
          nome_aluno?: string
          nota_admin?: string | null
          plano_id?: string | null
          plano_nome?: string | null
          status?: string
          telefone?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_numerario_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_numerario_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_numerario_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_numerario_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      planos: {
        Row: {
          ativo: boolean
          categoria: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          stripe_price_id_live: string | null
          stripe_price_id_test: string | null
          stripe_product_id: string | null
          valor: number
        }
        Insert: {
          ativo?: boolean
          categoria: string
          created_at?: string
          descricao?: string | null
          id: string
          nome: string
          stripe_price_id_live?: string | null
          stripe_price_id_test?: string | null
          stripe_product_id?: string | null
          valor: number
        }
        Update: {
          ativo?: boolean
          categoria?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          stripe_price_id_live?: string | null
          stripe_price_id_test?: string | null
          stripe_product_id?: string | null
          valor?: number
        }
        Relationships: []
      }
      presencas: {
        Row: {
          aluno_id: string
          aluno_nome: string
          aula_id: string | null
          created_at: string
          data: string
          gps_dist_m: number | null
          gps_lat: number | null
          gps_lng: number | null
          hora: string
          id: string
          metodo: string
          tipo: string
          turma_id: string | null
          turma_nome: string | null
        }
        Insert: {
          aluno_id: string
          aluno_nome: string
          aula_id?: string | null
          created_at?: string
          data?: string
          gps_dist_m?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          hora?: string
          id?: string
          metodo?: string
          tipo?: string
          turma_id?: string | null
          turma_nome?: string | null
        }
        Update: {
          aluno_id?: string
          aluno_nome?: string
          aula_id?: string | null
          created_at?: string
          data?: string
          gps_dist_m?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          hora?: string
          id?: string
          metodo?: string
          tipo?: string
          turma_id?: string | null
          turma_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presencas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presencas_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presencas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      professor_checkins: {
        Row: {
          created_at: string
          data: string
          hora_fim: string | null
          hora_inicio: string
          id: string
          professor_id: string | null
          professor_nome: string
          status: string
          turma_id: string | null
          turma_nome: string | null
        }
        Insert: {
          created_at?: string
          data?: string
          hora_fim?: string | null
          hora_inicio?: string
          id?: string
          professor_id?: string | null
          professor_nome: string
          status?: string
          turma_id?: string | null
          turma_nome?: string | null
        }
        Update: {
          created_at?: string
          data?: string
          hora_fim?: string | null
          hora_inicio?: string
          id?: string
          professor_id?: string | null
          professor_nome?: string
          status?: string
          turma_id?: string | null
          turma_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professor_checkins_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professor_checkins_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professor_checkins_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      professor_extras: {
        Row: {
          created_at: string
          data_admissao: string | null
          faixa: Database["public"]["Enums"]["belt_type"]
          foto: string | null
          grau: number
          id: string
          status: string
          turmas: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_admissao?: string | null
          faixa?: Database["public"]["Enums"]["belt_type"]
          foto?: string | null
          grau?: number
          id: string
          status?: string
          turmas?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_admissao?: string | null
          faixa?: Database["public"]["Enums"]["belt_type"]
          foto?: string | null
          grau?: number
          id?: string
          status?: string
          turmas?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professor_extras_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professor_extras_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean
          avatar_url: string | null
          created_at: string
          email: string
          faixa: Database["public"]["Enums"]["belt_type"] | null
          id: string
          matricula_completa: boolean
          morada: string | null
          nif: string | null
          nome: string
          role: Database["public"]["Enums"]["user_role"]
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          avatar_url?: string | null
          created_at?: string
          email: string
          faixa?: Database["public"]["Enums"]["belt_type"] | null
          id: string
          matricula_completa?: boolean
          morada?: string | null
          nif?: string | null
          nome: string
          role?: Database["public"]["Enums"]["user_role"]
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string
          faixa?: Database["public"]["Enums"]["belt_type"] | null
          id?: string
          matricula_completa?: boolean
          morada?: string | null
          nif?: string | null
          nome?: string
          role?: Database["public"]["Enums"]["user_role"]
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      responsaveis: {
        Row: {
          aluno_id: string | null
          created_at: string
          email: string | null
          id: string
          nif: string | null
          nome: string
          telefone: string | null
        }
        Insert: {
          aluno_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nif?: string | null
          nome: string
          telefone?: string | null
        }
        Update: {
          aluno_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nif?: string | null
          nome?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "responsaveis_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      templates_mensagem: {
        Row: {
          assunto: string | null
          canal: Database["public"]["Enums"]["msg_canal"]
          corpo: string
          created_at: string
          created_by: string | null
          id: string
          nome: string
        }
        Insert: {
          assunto?: string | null
          canal: Database["public"]["Enums"]["msg_canal"]
          corpo: string
          created_at?: string
          created_by?: string | null
          id?: string
          nome: string
        }
        Update: {
          assunto?: string | null
          canal?: Database["public"]["Enums"]["msg_canal"]
          corpo?: string
          created_at?: string
          created_by?: string | null
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_mensagem_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_mensagem_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      toc_documentos: {
        Row: {
          aluno_id: string | null
          aluno_nome: string
          created_at: string
          data_emissao: string
          estado: string
          id: string
          iva_total: number
          numero: string
          pagamento_id: string | null
          pdf_url: string | null
          plano_nome: string | null
          stripe_payment_id: string | null
          tipo: string
          valor_sem_iva: number
          valor_total: number
        }
        Insert: {
          aluno_id?: string | null
          aluno_nome: string
          created_at?: string
          data_emissao?: string
          estado?: string
          id?: string
          iva_total: number
          numero: string
          pagamento_id?: string | null
          pdf_url?: string | null
          plano_nome?: string | null
          stripe_payment_id?: string | null
          tipo?: string
          valor_sem_iva: number
          valor_total: number
        }
        Update: {
          aluno_id?: string | null
          aluno_nome?: string
          created_at?: string
          data_emissao?: string
          estado?: string
          id?: string
          iva_total?: number
          numero?: string
          pagamento_id?: string | null
          pdf_url?: string | null
          plano_nome?: string | null
          stripe_payment_id?: string | null
          tipo?: string
          valor_sem_iva?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "toc_documentos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toc_documentos_pagamento_id_fkey"
            columns: ["pagamento_id"]
            isOneToOne: false
            referencedRelation: "pagamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      turmas: {
        Row: {
          ativa: boolean
          capacidade: number
          created_at: string
          dias_semana: string[]
          horario: string
          id: string
          nivel: Database["public"]["Enums"]["turma_nivel"]
          nome: string
          professor_id: string | null
          professor_nome: string | null
          sala: string | null
          tipo: Database["public"]["Enums"]["turma_tipo"]
        }
        Insert: {
          ativa?: boolean
          capacidade?: number
          created_at?: string
          dias_semana?: string[]
          horario: string
          id?: string
          nivel?: Database["public"]["Enums"]["turma_nivel"]
          nome: string
          professor_id?: string | null
          professor_nome?: string | null
          sala?: string | null
          tipo?: Database["public"]["Enums"]["turma_tipo"]
        }
        Update: {
          ativa?: boolean
          capacidade?: number
          created_at?: string
          dias_semana?: string[]
          horario?: string
          id?: string
          nivel?: Database["public"]["Enums"]["turma_nivel"]
          nome?: string
          professor_id?: string | null
          professor_nome?: string | null
          sala?: string | null
          tipo?: Database["public"]["Enums"]["turma_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "turmas_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turmas_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      professores: {
        Row: {
          data_admissao: string | null
          email: string | null
          faixa: Database["public"]["Enums"]["belt_type"] | null
          foto: string | null
          grau: number | null
          id: string | null
          nome: string | null
          status: string | null
          telefone: string | null
          turmas: string[] | null
        }
        Relationships: []
      }
      v_kpis: {
        Row: {
          alunos_ativos: number | null
          inadimplentes: number | null
          novos_alunos: number | null
          receita_mensal: number | null
          receita_prevista: number | null
          total_alunos: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calcular_frequencia: {
        Args: { p_aluno_id: string; p_meses?: number }
        Returns: number
      }
      concluir_aula: { Args: { p_aula_id: string }; Returns: undefined }
      iniciar_aula: {
        Args: { p_data: string; p_turma_id: string }
        Returns: string
      }
      marcar_chat_lida: { Args: { p_aluno_id: string }; Returns: undefined }
      obter_ou_criar_aula: {
        Args: { p_data: string; p_turma_id: string }
        Returns: string
      }
      registrar_graduacao: {
        Args: {
          p_aluno_id: string
          p_faixa_nova: Database["public"]["Enums"]["belt_type"]
          p_grau_novo: number
          p_observacao?: string
        }
        Returns: {
          aluno_id: string
          aluno_nome: string
          created_at: string
          data: string
          faixa_anterior: Database["public"]["Enums"]["belt_type"]
          faixa_nova: Database["public"]["Enums"]["belt_type"]
          grau_anterior: number
          grau_novo: number
          id: string
          notificado_wa: boolean
          observacao: string | null
          professor_id: string | null
          professor_nome: string | null
        }
        SetofOptions: {
          from: "*"
          to: "graduacoes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      aluno_status: "ativo" | "inativo" | "suspenso"
      belt_type:
        | "branca"
        | "azul"
        | "roxa"
        | "marrom"
        | "preta"
        | "vermelha"
        | "cinza-branca"
        | "cinza"
        | "cinza-preta"
        | "amarela-branca"
        | "amarela"
        | "amarela-preta"
        | "laranja-branca"
        | "laranja"
        | "laranja-preta"
        | "verde-branca"
        | "verde"
        | "verde-preta"
      contrato_status: "ativo" | "cancelado" | "expirado"
      genero_type: "feminino" | "masculino" | "outro"
      msg_canal: "whatsapp" | "sms" | "email" | "push"
      msg_status: "enviado" | "pendente" | "erro" | "lido"
      payment_method: "stripe" | "numerario" | "transferencia"
      payment_status: "pago" | "pendente" | "vencido" | "cancelado"
      turma_nivel: "iniciante" | "intermediario" | "avancado" | "kids" | "all"
      turma_tipo: "gi" | "nogi" | "wrestling" | "kids"
      user_role: "superadmin" | "admin" | "atendimento" | "professor" | "aluno"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      aluno_status: ["ativo", "inativo", "suspenso"],
      belt_type: [
        "branca",
        "azul",
        "roxa",
        "marrom",
        "preta",
        "vermelha",
        "cinza-branca",
        "cinza",
        "cinza-preta",
        "amarela-branca",
        "amarela",
        "amarela-preta",
        "laranja-branca",
        "laranja",
        "laranja-preta",
        "verde-branca",
        "verde",
        "verde-preta",
      ],
      contrato_status: ["ativo", "cancelado", "expirado"],
      genero_type: ["feminino", "masculino", "outro"],
      msg_canal: ["whatsapp", "sms", "email", "push"],
      msg_status: ["enviado", "pendente", "erro", "lido"],
      payment_method: ["stripe", "numerario", "transferencia"],
      payment_status: ["pago", "pendente", "vencido", "cancelado"],
      turma_nivel: ["iniciante", "intermediario", "avancado", "kids", "all"],
      turma_tipo: ["gi", "nogi", "wrestling", "kids"],
      user_role: ["superadmin", "admin", "atendimento", "professor", "aluno"],
    },
  },
} as const

