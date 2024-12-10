import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PresentationList = () => {
  const [presentations, setPresentations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load presentations
  useEffect(() => {
    fetchPresentations();
  }, []);

  const fetchPresentations = async () => {
    try {
      setIsLoading(true);
      // Replace with your actual API endpoint
      const response = await fetch('/api/presentations');
      const data = await response.json();
      setPresentations(data);
    } catch (err) {
      setError('Failed to load presentations');
      console.error('Error loading presentations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this presentation?')) {
      return;
    }

    try {
      await fetch(`/api/presentations/${id}`, { method: 'DELETE' });
      setPresentations(presentations.filter(p => p.id !== id));
    } catch (err) {
      setError('Failed to delete presentation');
      console.error('Error deleting presentation:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Presentations</h2>
        <Button
          onClick={() => window.location.href = '/new-presentation'}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Presentation
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Presentations List */}
      <div className="space-y-4">
        {presentations.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              No presentations found. Create your first presentation to get started.
            </CardContent>
          </Card>
        ) : (
          presentations.map((presentation) => (
            <Card key={presentation.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {presentation.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(presentation.date)}
                        <span className="mx-2">•</span>
                        {presentation.slides?.length || 0} slides
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `/edit-presentation/${presentation.id}`}
                      className="text-gray-600 hover:text-blue-600"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(presentation.id)}
                      className="text-gray-600 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.href = `/presentation/${presentation.id}`}
                      className="text-gray-600"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Tags or Additional Info */}
                {presentation.tags && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {presentation.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PresentationList;