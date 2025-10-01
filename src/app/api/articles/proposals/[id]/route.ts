import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateProposalSchema = z.object({
  status: z.enum(['approved', 'rejected', 'changes_requested']),
  feedback: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin/reviewer (you might want to add role checking here)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (
      !profile ||
      !profile.role ||
      !['admin', 'editor'].includes(profile.role)
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsedData = updateProposalSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsedData.error.errors,
        },
        { status: 400 }
      );
    }

    const proposalId = params.id;
    const { status, feedback } = parsedData.data;

    // Get the current proposal to access proposer info
    const { data: currentProposal, error: fetchError } = await supabase
      .from('article_proposals')
      .select(
        `
        *,
        proposer:profiles!proposer_id(id, display_name, email)
      `
      )
      .eq('id', proposalId)
      .single();

    if (fetchError || !currentProposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Update the proposal
    const { data: updatedProposal, error: updateError } = await supabase
      .from('article_proposals')
      .update({
        status,
        feedback,
        reviewer_id: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', proposalId)
      .select(
        `
        *,
        proposer:profiles!proposer_id(display_name, email),
        reviewer:profiles!reviewer_id(display_name)
      `
      )
      .single();

    if (updateError) {
      console.error('Database error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Send notification email to proposer
    try {
      await sendProposalStatusNotification(updatedProposal, status, feedback);
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
      // Don't fail the request if email fails
    }

    // Create in-app notification
    try {
      await createInAppNotification(supabase, updatedProposal, status);
    } catch (notificationError) {
      console.error('Failed to create in-app notification:', notificationError);
    }

    return NextResponse.json(updatedProposal);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

async function sendProposalStatusNotification(
  proposal: any,
  status: string,
  feedback?: string
) {
  const { EmailService, createProposalNotificationData } = await import(
    '@/lib/services/emailService'
  );

  const notificationData = createProposalNotificationData(
    proposal,
    status as 'approved' | 'rejected' | 'changes_requested',
    feedback,
    proposal.reviewer?.display_name
  );

  await EmailService.sendProposalStatusNotification(notificationData);
}

async function createInAppNotification(
  supabase: any,
  proposal: any,
  status: string
) {
  const notificationMessages = {
    approved: `Your article proposal "${proposal.title}" has been approved! You can now start writing.`,
    rejected: `Your article proposal "${proposal.title}" was not approved. Check the feedback for details.`,
    changes_requested: `Changes have been requested for your article proposal "${proposal.title}". Please review the feedback.`,
  };

  await supabase.from('notifications').insert({
    user_id: proposal.proposer_id,
    type: 'proposal_status_update',
    title: 'Article Proposal Update',
    message: notificationMessages[status as keyof typeof notificationMessages],
    data: {
      proposal_id: proposal.id,
      status,
      feedback: proposal.feedback,
    },
  });
}
