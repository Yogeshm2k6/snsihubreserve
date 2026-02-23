const testMail = async () => {
    try {
        const res = await fetch('http://localhost:3001/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: 'yogeshmarichamy2203@gmail.com',
                subject: 'IHUB Booking Approval Required (Sample Test Project)',
                html: `
            <p>A new booking request is awaiting your approval.<br>
            <b>Staff Name:</b> Sample Staff Member<br>
            <b>Room:</b> Training Garage<br>
            <b>Date:</b> 2026-02-24<br>
            <b>Department:</b> Computer Science<br>
            Click the button below to Approve or Reject immediately.</p>
            <br>
            <div style="display: flex; gap: 15px; margin-top: 10px;">
              <a href="http://localhost:3000/?action=approve&id=sample_id&stage=1" style="padding: 10px 20px; background-color: #16a34a; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-family: sans-serif; display: inline-block;">Approve Request</a>
              <a href="http://localhost:3000/?action=reject&id=sample_id&stage=1" style="padding: 10px 20px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-family: sans-serif; display: inline-block;">Reject Request</a>
            </div>
            <br>
            <p style="font-size: 12px; color: #666;">If you are not logged in, you will be prompted to log in before the action executes.</p>
          `
            })
        });

        if (res.ok) {
            console.log('Sample email sent successfully via SMTP proxy!');
        } else {
            console.error('Failed to send email:', await res.text());
        }
    } catch (e) {
        console.error('Connection refused - is the SMTP server running? Make sure you ran `npm run server` ! Error details:', e.message);
    }
};

testMail();
