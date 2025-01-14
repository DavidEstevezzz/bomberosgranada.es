<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;

class MessageSent extends Mailable
{
    use Queueable, SerializesModels;

    public $message;

    /**
     * Create a new message instance.
     *
     * @param $message
     */
    public function __construct($message)
    {
        $this->message = $message;  // Mensaje que se está enviando
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject('Nuevo mensaje recibido')
                    ->view('emails.messages.sent')
                    ->with([
                        'subject' => $this->message->subject,
                        'body' => $this->message->body,
                        'sender' => $this->message->sender->name,
                    ]);
    }
}
