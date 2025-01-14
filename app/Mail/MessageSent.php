<?php

namespace App\Mail;

use App\Models\UserMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class MessageSent extends Mailable
{
    use Queueable, SerializesModels;

    public $message;

    public function __construct(UserMessage $message)
    {
        $this->message = $message;
    }

    public function build()
    {
        return $this->view('emails.sent')
                    ->with([
                        'messageData' => $this->message,
                        'sender'  => $this->message->sender,
                        'receiver' => $this->message->receiver,
                    ]);
    }
}
