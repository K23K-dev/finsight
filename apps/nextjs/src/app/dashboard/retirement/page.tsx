"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@finsight/ui/card";
import { Input } from "@finsight/ui/input";
import { Label } from "@finsight/ui/label";

export default function FIREPage() {
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(55);
  const [currentNetWorth, setCurrentNetWorth] = useState(100000);
  const [monthlyContribution, setMonthlyContribution] = useState(2000);
  const [annualReturn, setAnnualReturn] = useState(7);
  const [safeWithdrawalRate, setSafeWithdrawalRate] = useState(4);
  const [annualExpenses, setAnnualExpenses] = useState(60000);

  // Calculations
  const yearsToRetirement = retirementAge - currentAge;
  const fireNumber = annualExpenses * (100 / safeWithdrawalRate);

  const calculateProjection = () => {
    let balance = currentNetWorth;
    const monthlyRate = annualReturn / 100 / 12;
    const months = yearsToRetirement * 12;

    for (let i = 0; i < months; i++) {
      balance = (balance + monthlyContribution) * (1 + monthlyRate);
    }
    return balance;
  };

  const projectedNetWorth = calculateProjection();
  const isFIREAchieved = projectedNetWorth >= fireNumber;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <Calculator className="text-primary h-8 w-8" />
        <h1 className="text-3xl font-bold">FIRE Calculator</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Your Financial Details</CardTitle>
            <CardDescription>
              Adjust the values to see if you are on track for financial
              independence.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentAge">Current Age</Label>
                <Input
                  id="currentAge"
                  type="number"
                  value={currentAge}
                  onChange={(e) => setCurrentAge(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retirementAge">Target Retirement Age</Label>
                <Input
                  id="retirementAge"
                  type="number"
                  value={retirementAge}
                  onChange={(e) => setRetirementAge(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentNetWorth">
                Current Invested Assets ($)
              </Label>
              <Input
                id="currentNetWorth"
                type="number"
                value={currentNetWorth}
                onChange={(e) => setCurrentNetWorth(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyContribution">
                Monthly Contribution ($)
              </Label>
              <Input
                id="monthlyContribution"
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="annualExpenses">
                Expected Annual Expenses in Retirement ($)
              </Label>
              <Input
                id="annualExpenses"
                type="number"
                value={annualExpenses}
                onChange={(e) => setAnnualExpenses(Number(e.target.value))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="annualReturn">Annual Return (%)</Label>
                <Input
                  id="annualReturn"
                  type="number"
                  value={annualReturn}
                  onChange={(e) => setAnnualReturn(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="withdrawalRate">Safe Withdrawal Rate (%)</Label>
                <Input
                  id="withdrawalRate"
                  type="number"
                  value={safeWithdrawalRate}
                  onChange={(e) =>
                    setSafeWithdrawalRate(Number(e.target.value))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div className="flex flex-col gap-6">
          <Card
            className={
              isFIREAchieved
                ? "border-green-500/50 bg-green-500/5"
                : "border-yellow-500/50 bg-yellow-500/5"
            }
          >
            <CardHeader>
              <CardTitle>Verdict</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                At age <strong>{retirementAge}</strong>, you will have{" "}
                <span className="font-bold">
                  ${Math.round(projectedNetWorth).toLocaleString()}
                </span>
                .
              </p>
              <p className="text-muted-foreground mt-2">
                You need{" "}
                <strong>${Math.round(fireNumber).toLocaleString()}</strong> to
                cover your annual expenses of ${annualExpenses.toLocaleString()}
                .
              </p>
              <div className="mt-4 text-xl font-bold">
                {isFIREAchieved ? (
                  <span className="text-green-500">
                    🎉 You are on track for FIRE!
                  </span>
                ) : (
                  <span className="text-yellow-500">
                    ⚠️ You need to save more or retire later.
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">FIRE Number</span>
                <span className="font-mono font-bold">
                  ${Math.round(fireNumber).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Projected Net Worth
                </span>
                <span className="font-mono font-bold">
                  ${Math.round(projectedNetWorth).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gap</span>
                <span
                  className={`font-mono font-bold ${isFIREAchieved ? "text-green-500" : "text-red-500"}`}
                >
                  ${Math.round(projectedNetWorth - fireNumber).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
