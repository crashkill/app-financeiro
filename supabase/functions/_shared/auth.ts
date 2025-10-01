import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { User } from './types.ts'

export async function authenticateUser(req: Request): Promise<User | null> {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return null
    }

    // Get user profile with permissions
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, permissions')
      .eq('id', user.id)
      .single()

    return {
      id: user.id,
      email: user.email || '',
      role: profile?.role || 'user',
      permissions: profile?.permissions || []
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

export function requirePermission(user: User, permission: string): boolean {
  return user.permissions.includes(permission) || user.role === 'admin'
}

export function requireRole(user: User, requiredRole: string): boolean {
  const roleHierarchy = {
    'viewer': 1,
    'user': 2,
    'admin': 3
  }
  
  const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0
  
  return userLevel >= requiredLevel
}

export async function validateRequest(req: Request, schema: Record<string, string>): Promise<any> {
  try {
    const body = await req.json()
    const errors: string[] = []

    for (const [field, type] of Object.entries(schema)) {
      const isOptional = type.endsWith('?')
      const fieldType = type.replace('?', '')
      const value = body[field]

      if (!isOptional && (value === undefined || value === null)) {
        errors.push(`Field '${field}' is required`)
        continue
      }

      if (value !== undefined && value !== null) {
        switch (fieldType) {
          case 'string':
            if (typeof value !== 'string') {
              errors.push(`Field '${field}' must be a string`)
            }
            break
          case 'number':
            if (typeof value !== 'number') {
              errors.push(`Field '${field}' must be a number`)
            }
            break
          case 'boolean':
            if (typeof value !== 'boolean') {
              errors.push(`Field '${field}' must be a boolean`)
            }
            break
          case 'array':
            if (!Array.isArray(value)) {
              errors.push(`Field '${field}' must be an array`)
            }
            break
          case 'object':
            if (typeof value !== 'object' || Array.isArray(value)) {
              errors.push(`Field '${field}' must be an object`)
            }
            break
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(', ')}`)
    }

    return body
  } catch (error) {
    if (error.message.startsWith('Validation errors:')) {
      throw error
    }
    throw new Error('Invalid JSON in request body')
  }
}