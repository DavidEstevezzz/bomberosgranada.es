<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Firefighters_defined_assignment;

class RevertAssignmentsCommand extends Command
{
    protected $signature = 'assignments:revert';

    protected $description = 'Revert assignments that have reached their return date';

    public function handle()
    {
        $assignments = Firefighters_defined_assignment::all();
        foreach ($assignments as $assignment) {
            $assignment->checkAndRevertAssignment();
        }

        $this->info('Assignments reverted successfully.');
    }
}
