import React, { useState, useEffect } from 'react';
import { Bot } from '../types/bot';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface BotFormProps {
  bot?: Bot;
  onSave: () => void;
  onCancel: () => void;
}

export function BotForm({ bot, onSave, onCancel }: BotFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    description: '',
    forwarding_email: '',
  });

  useEffect(() => {
    if (bot) {
      setFormData({
        name: bot.name,
        email: bot.email,
        description: bot.description || '',
        forwarding_email: bot.forwarding_email,
      });
    }
  }, [bot]);

  const checkEmailExists = async (email: string): Promise<boolean> => {
    if (bot && bot.email === email) return false; // Skip check if updating bot with same email
    
    const { data, error } = await supabase
      .from('bots')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Error checking email:', error);
      return false;
    }

    return !!data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Authentication error: ' + sessionError.message);
      }
      if (!session) throw new Error('Please sign in to create or edit bots');

      // Check if email already exists
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        toast.error('A bot with this email already exists');
        setLoading(false);
        return;
      }

      if (bot) {
        // Update existing bot
        const { data, error } = await supabase
          .from('bots')
          .update(formData)
          .eq('id', bot.id)
          .select()
          .single();

        if (error) {
          console.error('Update error:', error);
          throw new Error('Failed to update bot: ' + error.message);
        }
        toast.success('Bot updated successfully');
      } else {
        // Create new bot
        console.log('Creating bot with data:', { ...formData, user_id: session.user.id });
        console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
        console.log('Session user:', session.user);
        
        const { data, error } = await supabase
          .from('bots')
          .insert([{ 
            name: formData.name,
            email: formData.email,
            description: formData.description,
            forwarding_email: formData.forwarding_email,
            user_id: session.user.id
          }])
          .select();

        if (error) {
          console.error('Insert error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            requestData: {
              name: formData.name,
              email: formData.email,
              description: formData.description,
              forwarding_email: formData.forwarding_email,
              user_id: session.user.id
            },
            session: {
              user: session.user,
              access_token: session.access_token
            }
          });
          throw new Error(`Failed to create bot: ${error.message}`);
        }
        console.log('Bot created successfully:', data);
        toast.success('Bot created successfully');
      }

      onSave();
    } catch (error) {
      console.error('Error saving bot:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to save bot: ' + JSON.stringify(error));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value.trim() })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Forwarding Email</label>
        <input
          type="email"
          required
          value={formData.forwarding_email}
          onChange={(e) => setFormData({ ...formData, forwarding_email: e.target.value.trim() })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : bot ? (
            'Update Bot'
          ) : (
            'Create Bot'
          )}
        </button>
      </div>
    </form>
  );
}