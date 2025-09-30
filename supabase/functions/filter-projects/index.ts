import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { logger } from '../_shared/logger.ts';

interface ProjectFilterRequest {
  year?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

interface ProjectResponse {
  id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    logger.info('Filter Projects Edge Function called');

    let requestData: ProjectFilterRequest = {};
    
    if (req.method === 'POST') {
      requestData = await req.json();
    } else if (req.method === 'GET') {
      const url = new URL(req.url);
      const year = url.searchParams.get('year');
      const search = url.searchParams.get('search');
      const limit = url.searchParams.get('limit');
      const offset = url.searchParams.get('offset');
      
      requestData = {
        year: year ? parseInt(year) : undefined,
        search: search || undefined,
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0
      };
    }

    logger.info('Request data:', requestData);

    // Build query for projects
    let query = supabase
      .from('projetos')
      .select('*')
      .order('name', { ascending: true });

    // Apply filters
    if (requestData.search) {
      query = query.ilike('name', `%${requestData.search}%`);
    }

    if (requestData.year) {
      // Filter projects that have records in the specified year in dre_hitss
      const { data: projectsWithDreRecords } = await supabase
        .from('dre_hitss')
        .select('projeto')
        .eq('ano', requestData.year)
        .eq('ativo', true);
      
      if (projectsWithDreRecords) {
        const projectNames = [...new Set(projectsWithDreRecords.map(t => t.projeto).filter(Boolean))];
        if (projectNames.length > 0) {
          query = query.in('name', projectNames);
        }
      }
    }

    // Apply pagination
    if (requestData.limit) {
      query = query.limit(requestData.limit);
    }
    if (requestData.offset) {
      query = query.range(requestData.offset, requestData.offset + (requestData.limit || 50) - 1);
    }

    const { data: projects, error } = await query;

    if (error) {
      logger.error('Error fetching projects:', error);
      throw error;
    }

    // If no projects table exists, fallback to extracting from dre_hitss
    if (!projects || projects.length === 0) {
      logger.info('No projects found in projetos table, extracting from dre_hitss');
      
      let dreQuery = supabase
        .from('dre_hitss')
        .select('projeto')
        .eq('ativo', true)
        .not('projeto', 'is', null)
        .not('projeto', 'eq', '')
        .order('projeto', { ascending: true });

      if (requestData.year) {
        dreQuery = dreQuery.eq('ano', requestData.year);
      }

      const { data: dreRecords, error: dreError } = await dreQuery;

      if (dreError) {
        logger.error('Error fetching dre_hitss records:', dreError);
        throw dreError;
      }

      // Extract unique projects from dre_hitss
      const uniqueProjects = new Map<string, ProjectResponse>();
      
      dreRecords?.forEach(record => {
        if (record.projeto && !uniqueProjects.has(record.projeto)) {
          uniqueProjects.set(record.projeto, {
            id: record.projeto,
            name: record.projeto,
            description: undefined,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      });

      const projectList = Array.from(uniqueProjects.values());
      
      // Apply search filter if provided
      let filteredProjects = projectList;
      if (requestData.search) {
        filteredProjects = projectList.filter(project => 
          project.name.toLowerCase().includes(requestData.search!.toLowerCase())
        );
      }

      // Apply pagination
      const startIndex = requestData.offset || 0;
      const endIndex = startIndex + (requestData.limit || 50);
      const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

      logger.info(`Found ${paginatedProjects.length} projects from dre_hitss`);

      return new Response(
        JSON.stringify({
          success: true,
          data: paginatedProjects,
          total: filteredProjects.length,
          page: Math.floor((requestData.offset || 0) / (requestData.limit || 50)) + 1,
          limit: requestData.limit || 50
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    logger.info(`Found ${projects.length} projects`);

    return new Response(
      JSON.stringify({
        success: true,
        data: projects,
        total: projects.length,
        page: Math.floor((requestData.offset || 0) / (requestData.limit || 50)) + 1,
        limit: requestData.limit || 50
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    logger.error('Error in filter-projects function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        details: error
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});