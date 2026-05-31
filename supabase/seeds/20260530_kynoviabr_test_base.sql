do $$
declare
  v_profile_id uuid;
  v_client_id uuid;
  v_gp_id uuid;
  v_portfolio_id uuid;
  v_project_s4_id uuid;
  v_project_btp_id uuid;
  v_responsible_gp_id uuid;
  v_responsible_arch_id uuid;
begin
  select id
  into v_profile_id
  from public.profiles
  where lower(email) = lower('kynoviabr@gmail.com')
  limit 1;

  if v_profile_id is null then
    raise exception 'Profile not found for kynoviabr@gmail.com. Log in once before running this seed.';
  end if;

  update public.profiles
  set
    full_name = coalesce(full_name, 'Kynovia Tech'),
    role = 'client',
    is_active = true
  where id = v_profile_id;

  select id
  into v_client_id
  from public.clients
  where name = 'Kynovia Tech'
    and deleted_at is null
  limit 1;

  if v_client_id is null then
    insert into public.clients (name, status, notes, internal_owner_id)
    values (
      'Kynovia Tech',
      'active',
      'Cliente de teste criado para validar dashboards e módulo de riscos.',
      v_profile_id
    )
    returning id into v_client_id;
  else
    update public.clients
    set
      status = 'active',
      deleted_at = null,
      internal_owner_id = v_profile_id
    where id = v_client_id;
  end if;

  if not exists (
    select 1 from public.client_contacts
    where client_id = v_client_id
      and lower(email) = lower('kynoviabr@gmail.com')
      and deleted_at is null
  ) then
    insert into public.client_contacts (client_id, name, role_title, phone, email, is_primary)
    values (
      v_client_id,
      'Kynovia Tech',
      'Contato principal',
      '(11) 99999-0000',
      'kynoviabr@gmail.com',
      true
    );
  end if;

  insert into public.professionals (full_name, email, whatsapp, function, is_active)
  values
    ('Marina Costa', 'marina.costa@k-riskhub.test', '(11) 98888-1001', 'project_manager', true),
    ('Rafael Lima', 'rafael.lima@k-riskhub.test', '(11) 98888-1002', 'portfolio_manager', true)
  on conflict (email, function) do update
  set
    full_name = excluded.full_name,
    whatsapp = excluded.whatsapp,
    is_active = true;

  select id into v_gp_id
  from public.professionals
  where email = 'marina.costa@k-riskhub.test'
    and function = 'project_manager';

  select id into v_portfolio_id
  from public.professionals
  where email = 'rafael.lima@k-riskhub.test'
    and function = 'portfolio_manager';

  insert into public.projects (
    client_id,
    project_number,
    name,
    description,
    professional_gp_id,
    professional_portfolio_manager_id,
    phase,
    status,
    starts_on,
    target_ends_on
  )
  values (
    v_client_id,
    'KRH-2026-001',
    'Implantação SAP S/4HANA',
    'Projeto de teste para validação do ciclo de gestão de riscos.',
    v_gp_id,
    v_portfolio_id,
    '3 - Realize',
    'active',
    current_date - 45,
    current_date + 120
  )
  on conflict (client_id, project_number) do update
  set
    name = excluded.name,
    description = excluded.description,
    professional_gp_id = excluded.professional_gp_id,
    professional_portfolio_manager_id = excluded.professional_portfolio_manager_id,
    phase = excluded.phase,
    status = excluded.status,
    starts_on = excluded.starts_on,
    target_ends_on = excluded.target_ends_on,
    deleted_at = null
  returning id into v_project_s4_id;

  insert into public.projects (
    client_id,
    project_number,
    name,
    description,
    professional_gp_id,
    professional_portfolio_manager_id,
    phase,
    status,
    starts_on,
    target_ends_on
  )
  values (
    v_client_id,
    'KRH-2026-002',
    'Integração SAP BTP',
    'Projeto de teste para validação de exposição técnica e integração.',
    v_gp_id,
    v_portfolio_id,
    '2 - Explore',
    'active',
    current_date - 15,
    current_date + 150
  )
  on conflict (client_id, project_number) do update
  set
    name = excluded.name,
    description = excluded.description,
    professional_gp_id = excluded.professional_gp_id,
    professional_portfolio_manager_id = excluded.professional_portfolio_manager_id,
    phase = excluded.phase,
    status = excluded.status,
    starts_on = excluded.starts_on,
    target_ends_on = excluded.target_ends_on,
    deleted_at = null
  returning id into v_project_btp_id;

  insert into public.project_members (project_id, user_id, member_role, can_edit)
  values
    (v_project_s4_id, v_profile_id, 'client', false),
    (v_project_btp_id, v_profile_id, 'client', false)
  on conflict (project_id, user_id) do update
  set
    member_role = excluded.member_role,
    can_edit = excluded.can_edit;

  if not exists (
    select 1 from public.responsibles
    where project_id = v_project_s4_id
      and lower(email) = lower('marina.costa@k-riskhub.test')
  ) then
    insert into public.responsibles (client_id, project_id, name, email, role_label, is_active)
    values (v_client_id, v_project_s4_id, 'Marina Costa', 'marina.costa@k-riskhub.test', 'Gerente de Projetos', true);
  end if;

  if not exists (
    select 1 from public.responsibles
    where project_id = v_project_s4_id
      and lower(email) = lower('arquitetura@k-riskhub.test')
  ) then
    insert into public.responsibles (client_id, project_id, name, email, role_label, is_active)
    values (v_client_id, v_project_s4_id, 'Arquitetura SAP', 'arquitetura@k-riskhub.test', 'Arquitetura', true);
  end if;

  if not exists (
    select 1 from public.responsibles
    where project_id = v_project_btp_id
      and lower(email) = lower('rafael.lima@k-riskhub.test')
  ) then
    insert into public.responsibles (client_id, project_id, name, email, role_label, is_active)
    values (v_client_id, v_project_btp_id, 'Rafael Lima', 'rafael.lima@k-riskhub.test', 'Gerente de Portfólio', true);
  end if;

  select id into v_responsible_gp_id
  from public.responsibles
  where project_id = v_project_s4_id
    and email = 'marina.costa@k-riskhub.test'
  limit 1;

  select id into v_responsible_arch_id
  from public.responsibles
  where project_id = v_project_s4_id
    and email = 'arquitetura@k-riskhub.test'
  limit 1;

  if not exists (
    select 1 from public.risks
    where project_id = v_project_s4_id
      and sequence_number = 1
      and deleted_at is null
  ) then
    insert into public.risks (
      project_id,
      sequence_number,
      group_name,
      phase,
      description,
      origin,
      identified_on,
      main_impact,
      probability_label,
      probability_score,
      impact_label,
      impact_score,
      response_type,
      response_plan,
      external_tool,
      external_reference_id,
      external_reference_url,
      responsible_id,
      responsible_name,
      status,
      created_by
    )
    values (
      v_project_s4_id,
      1,
      'Técnico',
      '3 - Realize',
      'Ausência de equipe técnica especializada para pontos críticos SAP, comprometendo resolução de bloqueios.',
      'Interno',
      current_date - 10,
      'Tempo',
      'Grande',
      4,
      'Alto',
      4,
      'mitigate',
      'Mapear especialistas críticos, definir plano de cobertura e acionar fornecedor para suporte sob demanda.',
      'Jira',
      'KRISK-001',
      'https://jira.example.com/browse/KRISK-001',
      v_responsible_gp_id,
      'Marina Costa',
      'in_progress',
      v_profile_id
    );
  end if;

  if not exists (
    select 1 from public.risks
    where project_id = v_project_s4_id
      and sequence_number = 2
      and deleted_at is null
  ) then
    insert into public.risks (
      project_id,
      sequence_number,
      group_name,
      phase,
      description,
      origin,
      identified_on,
      main_impact,
      probability_label,
      probability_score,
      impact_label,
      impact_score,
      response_type,
      response_plan,
      external_tool,
      external_reference_id,
      responsible_id,
      responsible_name,
      status,
      created_by
    )
    values (
      v_project_s4_id,
      2,
      'Operacional',
      '3 - Realize',
      'Comunicação inadequada sobre escopo, cronograma e prioridades, gerando desalinhamento entre frentes.',
      'Interno',
      current_date - 7,
      'Escopo',
      'Média',
      3,
      'Moderado',
      3,
      'mitigate',
      'Estabelecer ritual semanal de alinhamento, registrar decisões e publicar resumo executivo para as frentes.',
      'Planner',
      'PLN-204',
      v_responsible_gp_id,
      'Marina Costa',
      'open',
      v_profile_id
    );
  end if;

  if not exists (
    select 1 from public.risks
    where project_id = v_project_btp_id
      and sequence_number = 1
      and deleted_at is null
  ) then
    insert into public.risks (
      project_id,
      sequence_number,
      group_name,
      phase,
      description,
      origin,
      identified_on,
      main_impact,
      probability_label,
      probability_score,
      impact_label,
      impact_score,
      response_type,
      response_plan,
      external_tool,
      external_reference_id,
      responsible_id,
      responsible_name,
      status,
      created_by
    )
    values (
      v_project_btp_id,
      1,
      'Técnico',
      '2 - Explore',
      'Quebra de integrações com sistemas legados, APIs externas ou EDI durante desenho da arquitetura.',
      'Externo',
      current_date - 5,
      'Qualidade',
      'Grande',
      4,
      'Catastrófico',
      5,
      'research',
      null,
      'Azure DevOps',
      'ADO-778',
      v_responsible_arch_id,
      'Arquitetura SAP',
      'open',
      v_profile_id
    );
  end if;

  insert into public.audit_log (actor_id, entity_table, entity_id, action, new_data)
  values (
    v_profile_id,
    'seed',
    v_client_id,
    'upsert_test_base',
    jsonb_build_object(
      'email', 'kynoviabr@gmail.com',
      'client', 'Kynovia Tech',
      'projects', array['KRH-2026-001', 'KRH-2026-002']
    )
  );
end $$;
