import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Bot } from './types/bot';
import { BotForm } from './components/BotForm';
import { AuthButton } from './components/AuthButton';
import { Navigation } from './components/Navigation';
import { SettingsView } from './components/SettingsView';
import { Plus, Edit2, Trash2, Mail } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

function App() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBot, setEditingBot] = useState<Bot | undefined>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<'bots' | 'settings'>('bots');

  useEffect(() => {
    checkAuth();
    fetchBots();
    
    // Subscribe to changes
    const subscription = supabase
      .channel('bots_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bots' }, fetchBots)
      .subscribe();

    // Subscribe to auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
      if (authSubscription) authSubscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  };

  const fetchBots = async () => {
    try {
      const { data, error } = await supabase
        .from('bots')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBots(data || []);
    } catch (error) {
      console.error('Error fetching bots:', error);
      toast.error('Failed to fetch bots');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bot: Bot) => {
    if (!confirm('Are you sure you want to delete this bot?')) return;

    try {
      const { error } = await supabase
        .from('bots')
        .delete()
        .eq('id', bot.id);

      if (error) throw error;
      toast.success('Bot deleted successfully');
      await fetchBots();
    } catch (error) {
      console.error('Error deleting bot:', error);
      toast.error('Failed to delete bot');
    }
  };

  const handleEdit = (bot: Bot) => {
    setEditingBot(bot);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingBot(undefined);
  };

  const handleFormSave = async () => {
    handleFormClose();
    await fetchBots();
  };

  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">Please sign in to manage bots.</p>
        </div>
      );
    }

    if (currentView === 'settings') {
      return <SettingsView />;
    }

    return (
      <>
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">
                {editingBot ? 'Edit Bot' : 'Create New Bot'}
              </h2>
              <BotForm
                bot={editingBot}
                onSave={handleFormSave}
                onCancel={handleFormClose}
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : bots.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No bots created yet. Click "Create Bot" to get started.</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {bots.map((bot) => (
                <li key={bot.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{bot.name}</h3>
                      <p className="text-sm text-gray-500">{bot.email}</p>
                      <p className="text-sm text-gray-500 mt-1">{bot.description}</p>
                      <p className="text-sm text-gray-500">Forwards to: {bot.forwarding_email}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(bot)}
                        className="p-2 text-gray-400 hover:text-blue-600"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(bot)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Mail className="w-6 h-6 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">AgentChief EmailBots</h1>
            </div>
            <div className="flex space-x-4">
              <AuthButton 
                isAuthenticated={isAuthenticated} 
                onAuthChange={checkAuth} 
              />
              {isAuthenticated && currentView === 'bots' && (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Bot
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {isAuthenticated && (
        <Navigation currentView={currentView} onViewChange={setCurrentView} />
      )}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;