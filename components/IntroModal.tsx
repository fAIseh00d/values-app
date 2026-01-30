"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";

interface IntroModalProps {
  open: boolean;
  onClose: () => void;
}

export function IntroModal({ open, onClose }: IntroModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent onClose={onClose} className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Values Card Sort Exercise</DialogTitle>
          <DialogDescription className="text-base">
            From "Stop Self-Sabotage" by Dr. Judy Ho
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">What is this?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This exercise helps you identify and prioritize your personal values. Values influence
              our behaviors and decision-making, making it easier to respond to circumstances,
              opportunities, and challenges with integrity and authenticity.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">How to use this tool</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Sort 33 value cards into three columns based on their importance to you</li>
              <li>Each column must have exactly <strong>11 cards</strong></li>
              <li>Drag cards between columns to organize them</li>
              <li>Cards will automatically rebalance to maintain 11 per column</li>
              <li>On mobile, tap cards to view their full descriptions</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Remember</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Rank these values based on your current priorities, right now in this moment.
              There are <strong>no right or wrong answers</strong> – just be honest with yourself.
              The goal is to help you make decisions and set goals that align with what truly matters to you.
            </p>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground italic">
              "Goals that are firmly rooted in values will be that much more self-sabotage-proof."
              <br />– Dr. Judy Ho
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} size="lg" className="w-full sm:w-auto">
            Start Sorting
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
