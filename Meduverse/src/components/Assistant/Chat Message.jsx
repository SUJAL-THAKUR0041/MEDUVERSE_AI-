import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Bot, AlertTriangle } from "lucide-react";


export default function ChatMessage({ message, isUser, confidence, category }) {
  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-indigo-600' : 'bg-emerald-600'
      }`}>
        {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
      </div>
      
      <Card className={`p-4 max-w-3xl ${isUser ? 'bg-indigo-50' : 'bg-white'}`}>
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap">{message}</p>
        </div>
        
        {!isUser && confidence && (
          <div className="flex gap-2 mt-3 pt-3 border-t">
            <Badge variant="outline" className="text-xs">
              {confidence} Confidence
            </Badge>
            {category && (
              <Badge variant="secondary" className="text-xs">
                {category}
              </Badge>
            )}
          </div>
        )}
        
        {!isUser && message.includes('⚠️') && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t text-red-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-medium">Emergency Alert</span>
          </div>
        )}
      </Card>
    </div>
  );
}

