
import React, { useState } from "react";
import { geminiClient } from "../api/groq";
import { mockAuth } from "../api/mockAuth";
import { localStorage } from "../api/localStorage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Plus, Star, Search, Brain } from "lucide-react";

export default function StudyHubPage() {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    subject: "anatomy",
    topic: "",
    content: "",
    tags: ""
  });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => mockAuth.currentUser,
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['studyNotes', user?.email],
    queryFn: () => localStorage.StudyNote?.get(user.email) || [],
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: (data) => localStorage.StudyNote?.save(user.email, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyNotes'] });
      setShowForm(false);
      setFormData({ subject: "anatomy", topic: "", content: "", tags: "" });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }) => localStorage.StudyNote?.save(user.email, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyNotes'] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const tags = formData.tags.split(',').map(t => t.trim()).filter(t => t);
    createMutation.mutate({ 
      ...formData, 
      tags,
      user_email: user.email 
    });
  };

  const filteredNotes = notes.filter(note => 
    note.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const subjectColors = {
    anatomy: "bg-red-100 text-red-800",
    physiology: "bg-blue-100 text-blue-800",
    biochemistry: "bg-green-100 text-green-800",
    pharmacology: "bg-purple-100 text-purple-800",
    pathology: "bg-orange-100 text-orange-800",
    microbiology: "bg-teal-100 text-teal-800",
    other: "bg-gray-100 text-gray-800"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Brain className="w-8 h-8 text-indigo-600" />
              Study Hub
            </h1>
            <p className="text-gray-600">Your medical education companion</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-5 h-5 mr-2" />
            Add Note
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search notes by topic, subject, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Select value={formData.subject} onValueChange={(v) => setFormData({...formData, subject: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anatomy">Anatomy</SelectItem>
                      <SelectItem value="physiology">Physiology</SelectItem>
                      <SelectItem value="biochemistry">Biochemistry</SelectItem>
                      <SelectItem value="pharmacology">Pharmacology</SelectItem>
                      <SelectItem value="pathology">Pathology</SelectItem>
                      <SelectItem value="microbiology">Microbiology</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Topic name"
                    value={formData.topic}
                    onChange={(e) => setFormData({...formData, topic: e.target.value})}
                    required
                  />
                </div>
                <Textarea
                  placeholder="Write your notes here..."
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows={6}
                  required
                />
                <Input
                  placeholder="Tags (comma separated)"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                />
                <div className="flex gap-3">
                  <Button type="submit">Save Note</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                      <CardTitle>{note.topic}</CardTitle>
                      <button
                        onClick={() => toggleFavoriteMutation.mutate({ id: note.id, isFavorite: note.is_favorite })}
                      >
                        <Star className={`w-5 h-5 ${note.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                      </button>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <Badge className={subjectColors[note.subject]}>{note.subject}</Badge>
                      {note.tags?.map((tag, idx) => (
                        <Badge key={idx} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredNotes.length === 0 && (
          <Card className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No notes found. Start adding your study notes!</p>
          </Card>
        )}
      </div>
    </div>
  );
}

