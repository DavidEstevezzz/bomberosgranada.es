<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PdfDocumentView extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'pdf_document_id',
        'viewed_at',
    ];

    protected $casts = [
        'viewed_at' => 'datetime',
    ];

    public function document()
    {
        return $this->belongsTo(PdfDocument::class, 'pdf_document_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}