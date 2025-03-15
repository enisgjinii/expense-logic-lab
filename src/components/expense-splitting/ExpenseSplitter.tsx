
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { Transaction, SplitParticipant } from '@/types/finance';
import { Check, Trash2, UserPlus, Users, Calculator, ChevronsUpDown } from 'lucide-react';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

interface ExpenseSplitterProps {
  transaction: Transaction;
  onChange: (transaction: Transaction) => void;
}

const ExpenseSplitter: React.FC<ExpenseSplitterProps> = ({ transaction, onChange }) => {
  const [participantName, setParticipantName] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [splitEvenly, setSplitEvenly] = useState(true);

  const participants = transaction.splitWith || [];
  
  // Total amount to be split
  const totalAmount = transaction.amount;
  
  // Calculate the amount per person for even splitting
  const amountPerPerson = participants.length > 0 
    ? totalAmount / (participants.length + 1) // +1 for current user
    : totalAmount;

  const handleAddParticipant = () => {
    if (!participantName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for the participant",
        variant: "destructive"
      });
      return;
    }

    const newParticipant: SplitParticipant = {
      id: uuidv4(),
      name: participantName.trim(),
      amount: splitEvenly ? amountPerPerson : 0,
      paid: false,
      email: participantEmail.trim() || undefined
    };

    const updatedSplitWith = [...participants, newParticipant];
    
    if (splitEvenly) {
      // Recalculate even split with new participant
      const newAmountPerPerson = totalAmount / (updatedSplitWith.length + 1);
      updatedSplitWith.forEach(p => p.amount = newAmountPerPerson);
    }

    onChange({
      ...transaction,
      splitWith: updatedSplitWith
    });

    setParticipantName('');
    setParticipantEmail('');
  };

  const handleRemoveParticipant = (id: string) => {
    const updatedSplitWith = participants.filter(p => p.id !== id);
    
    if (splitEvenly && updatedSplitWith.length > 0) {
      // Recalculate even split after removing participant
      const newAmountPerPerson = totalAmount / (updatedSplitWith.length + 1);
      updatedSplitWith.forEach(p => p.amount = newAmountPerPerson);
    }

    onChange({
      ...transaction,
      splitWith: updatedSplitWith
    });
  };

  const handleTogglePaid = (id: string) => {
    const updatedSplitWith = participants.map(p => 
      p.id === id ? { ...p, paid: !p.paid } : p
    );

    onChange({
      ...transaction,
      splitWith: updatedSplitWith
    });
  };

  const handleAmountChange = (id: string, amount: number) => {
    const updatedSplitWith = participants.map(p => 
      p.id === id ? { ...p, amount } : p
    );

    onChange({
      ...transaction,
      splitWith: updatedSplitWith
    });
  };

  const toggleSplitEvenly = () => {
    const newSplitEvenly = !splitEvenly;
    setSplitEvenly(newSplitEvenly);
    
    if (newSplitEvenly && participants.length > 0) {
      // Recalculate for even splitting
      const amountPerPerson = totalAmount / (participants.length + 1);
      const updatedSplitWith = participants.map(p => ({
        ...p,
        amount: amountPerPerson
      }));
      
      onChange({
        ...transaction,
        splitWith: updatedSplitWith
      });
    }
  };

  // Calculate how much has been allocated to participants
  const totalAllocated = participants.reduce((sum, p) => sum + p.amount, 0);
  
  // Calculate how much the current user owes
  const userAmount = totalAmount - totalAllocated;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <Card className="border border-dashed">
        <CollapsibleTrigger asChild>
          <CardHeader className="p-4 cursor-pointer hover:bg-accent/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Split Expense</CardTitle>
                {participants.length > 0 && (
                  <Badge variant="outline" className="ml-2">{participants.length} people</Badge>
                )}
              </div>
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Split this expense of ${totalAmount.toFixed(2)} with others
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="splitEvenly" className="text-sm">Split Evenly</Label>
                <Switch
                  id="splitEvenly"
                  checked={splitEvenly}
                  onCheckedChange={toggleSplitEvenly}
                />
              </div>
            </div>
              
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-5 sm:col-span-5">
                <Label htmlFor="name" className="text-xs">Name</Label>
                <Input
                  id="name"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="Person's name"
                />
              </div>
              <div className="col-span-5 sm:col-span-5">
                <Label htmlFor="email" className="text-xs">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={participantEmail}
                  onChange={(e) => setParticipantEmail(e.target.value)}
                  placeholder="Email address"
                />
              </div>
              <div className="col-span-2 sm:col-span-2 flex items-end">
                <Button 
                  onClick={handleAddParticipant} 
                  className="w-full" 
                  size="sm"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>
              
            {participants.length > 0 && (
              <div className="space-y-2 border rounded-md p-2">
                <div className="text-sm font-medium">Participants</div>
                {participants.map((person) => (
                  <div key={person.id} className="grid grid-cols-12 gap-2 items-center py-1">
                    <div className="col-span-4 truncate">
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 mr-1"
                          onClick={() => handleTogglePaid(person.id)}
                        >
                          {person.paid ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2" />
                          )}
                        </Button>
                        <span className={person.paid ? "line-through text-muted-foreground" : ""}>
                          {person.name}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-6">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={person.amount}
                        disabled={splitEvenly}
                        onChange={(e) => handleAmountChange(person.id, parseFloat(e.target.value) || 0)}
                        className="h-7 text-sm"
                      />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveParticipant(person.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Separator className="my-2" />
                
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium">You owe:</span>
                  </div>
                  <div className="font-medium">
                    ${userAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default ExpenseSplitter;
