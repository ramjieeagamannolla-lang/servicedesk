// Usage: npm run seed  (reads MONGO_URI from .env, WIPES existing data)
require('dotenv').config();
const mongoose = require('mongoose');

const Department = require('../models/Department');
const Category = require('../models/Category');
const SLA = require('../models/SLA');
const User = require('../models/User');
const Asset = require('../models/Asset');
const AssetHistory = require('../models/AssetHistory');
const KnowledgeArticle = require('../models/KnowledgeArticle');
const Ticket = require('../models/Ticket');
const TicketComment = require('../models/TicketComment');
const WorkLog = require('../models/WorkLog');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { Counter } = require('../models/Counter');

const { fallbackClassify } = require('../services/aiService');
const { calculateDeadlines } = require('../services/slaService');
const { generateTicketNumber, generateAssetTag } = require('../utils/idGenerator');

const { departments, categories, slaConfigs, users, assets, knowledgeArticles } = require('./seedData');
const { ticketTemplates } = require('./ticketTemplates');

function hoursAgoDate(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function wipe() {
  await Promise.all([
    Ticket.deleteMany({}),
    TicketComment.deleteMany({}),
    WorkLog.deleteMany({}),
    Asset.deleteMany({}),
    AssetHistory.deleteMany({}),
    KnowledgeArticle.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
    User.deleteMany({}),
    Department.deleteMany({}),
    Category.deleteMany({}),
    SLA.deleteMany({}),
    Counter.deleteMany({}),
  ]);
  console.log('[seed] Cleared existing collections');
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('[seed] Connected to MongoDB');

  await wipe();

  // --- Departments ---------------------------------------------------
  const deptDocs = await Department.insertMany(departments);
  const deptByName = Object.fromEntries(deptDocs.map((d) => [d.name, d._id]));
  console.log(`[seed] Inserted ${deptDocs.length} departments`);

  // --- Categories ------------------------------------------------------
  await Category.insertMany(categories);
  console.log(`[seed] Inserted ${categories.length} categories`);

  // --- SLA configs -------------------------------------------------------
  await SLA.insertMany(slaConfigs);
  console.log(`[seed] Inserted ${slaConfigs.length} SLA configs`);

  // --- Users (created one at a time so the password-hashing pre-save hook runs) ---
  const userDocs = [];
  for (const u of users) {
    const doc = await User.create({
      name: u.name,
      email: u.email,
      password: u.password,
      role: u.role,
      department: deptByName[u.department],
    });
    userDocs.push(doc);
  }
  const userByEmail = Object.fromEntries(userDocs.map((u) => [u.email, u]));
  console.log(`[seed] Inserted ${userDocs.length} users`);

  // --- Assets --------------------------------------------------------------
  const assetDocs = [];
  for (const a of assets) {
    const assetTag = await generateAssetTag(a.type);
    const assignedTo = a.assignedToEmail ? userByEmail[a.assignedToEmail]?._id : null;
    const doc = await Asset.create({
      assetTag,
      name: a.name,
      type: a.type,
      brand: a.brand,
      model: a.model,
      serialNumber: `SN-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      purchaseDate: hoursAgoDate(24 * 365),
      warrantyExpiry: hoursAgoDate(-24 * 365 * 2), // ~2 years in the future
      department: deptByName[a.department],
      location: a.location,
      assignedTo,
      status: a.status || (assignedTo ? 'ASSIGNED' : 'AVAILABLE'),
    });
    await AssetHistory.create({
      asset: doc._id,
      action: 'CREATED',
      performedBy: userByEmail['asset@demo.com']._id,
      toValue: assetTag,
    });
    if (assignedTo) {
      await AssetHistory.create({
        asset: doc._id,
        action: 'ASSIGNED',
        performedBy: userByEmail['asset@demo.com']._id,
        toValue: userByEmail[a.assignedToEmail].name,
      });
    }
    assetDocs.push(doc);
  }
  console.log(`[seed] Inserted ${assetDocs.length} assets`);

  // --- Knowledge base articles ------------------------------------------
  const articleDocs = [];
  for (const a of knowledgeArticles) {
    const doc = await KnowledgeArticle.create({
      title: a.title,
      category: a.category,
      tags: a.tags,
      symptoms: a.symptoms,
      solution: a.solution,
      author: userByEmail[a.authorEmail]._id,
      status: 'PUBLISHED',
      views: Math.floor(Math.random() * 200) + 10,
      helpfulVotes: Math.floor(Math.random() * 40),
    });
    articleDocs.push(doc);
  }
  console.log(`[seed] Inserted ${articleDocs.length} knowledge base articles`);

  // --- Tickets -------------------------------------------------------------
  let ticketCount = 0;
  let commentCount = 0;
  let workLogCount = 0;
  let notificationCount = 0;

  for (const t of ticketTemplates) {
    const requester = userByEmail[t.requesterEmail];
    const assignee = t.assigneeEmail ? userByEmail[t.assigneeEmail] : null;
    const createdAt = hoursAgoDate((t.daysAgo || 0) * 24 + (t.hoursAgo || 0));

    const ai = fallbackClassify({ title: t.title, description: t.description });
    const finalCategory = t.category || ai.category;
    const finalPriority = t.priority || ai.priority;

    const relatedArticles = articleDocs
      .filter((a) => a.category === finalCategory)
      .slice(0, 2)
      .map((a) => a._id);

    let deadlines = await calculateDeadlines(finalPriority, createdAt);

    // Force a breach scenario for templates flagged breach:true, regardless
    // of how far back createdAt is, so the dashboard always has a realistic
    // mix of SAFE / AT_RISK / BREACHED tickets to show off.
    if (t.breach) {
      deadlines = {
        responseDeadline: hoursAgoDate(3),
        resolutionDeadline: hoursAgoDate(2),
      };
    }

    const ticketNumber = await generateTicketNumber();
    const isTerminal = t.status === 'RESOLVED' || t.status === 'CLOSED';

    const ticketData = {
      ticketNumber,
      title: t.title,
      description: t.description,
      category: finalCategory,
      subcategory: ai.subcategory,
      priority: finalPriority,
      status: t.status,
      impact: finalPriority === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
      urgency: finalPriority === 'CRITICAL' || finalPriority === 'HIGH' ? 'HIGH' : 'MEDIUM',
      requester: requester._id,
      department: requester.department,
      assignedTo: assignee ? assignee._id : null,
      ai: {
        predictedCategory: ai.category,
        predictedSubcategory: ai.subcategory,
        predictedPriority: ai.priority,
        confidence: ai.confidence,
        summary: ai.summary,
        suggestedSolution: ai.suggestedSolution,
        relatedArticles,
        source: 'fallback',
        analyzedAt: createdAt,
      },
      sla: {
        responseDeadline: deadlines.responseDeadline,
        resolutionDeadline: deadlines.resolutionDeadline,
        respondedAt: assignee ? new Date(createdAt.getTime() + 15 * 60000) : undefined,
        status: 'SAFE',
        escalationLevel: t.breach ? 2 : 0,
      },
      reopenCount: t.reopened ? 1 : 0,
    };

    if (t.resolutionSummary) {
      const safeOffset = Math.round((deadlines.resolutionDeadline - createdAt) * 0.6);
      const resolvedAt = t.breach
        ? new Date(deadlines.resolutionDeadline.getTime() + 30 * 60000) // after deadline -> breached
        : new Date(createdAt.getTime() + Math.max(safeOffset, 20 * 60000)); // well before deadline -> safe

      ticketData.resolution = {
        summary: t.resolutionSummary,
        resolvedBy: assignee ? assignee._id : userByEmail['technician@demo.com']._id,
        resolvedAt,
        confirmedByRequester: Boolean(t.confirmed),
        confirmedAt: t.confirmed ? new Date(resolvedAt.getTime() + 30 * 60000) : undefined,
      };
      ticketData.sla.status = resolvedAt > deadlines.resolutionDeadline ? 'BREACHED' : 'SAFE';
      if (t.status === 'CLOSED') {
        ticketData.closedAt = t.confirmed ? ticketData.resolution.confirmedAt : resolvedAt;
      }
    }

    const ticket = new Ticket(ticketData);
    ticket.set('createdAt', createdAt);
    ticket.set('updatedAt', createdAt);
    await ticket.save({ timestamps: false });
    ticketCount += 1;

    // A couple of comments + a work log for tickets that have an assignee,
    // so the ticket detail page (timeline, comments, work logs) has real content.
    if (assignee) {
      await WorkLog.create({
        ticket: ticket._id,
        technician: assignee._id,
        description: `Investigated the issue reported by ${requester.name} and began troubleshooting.`,
        minutesSpent: 20,
      });
      workLogCount += 1;

      await TicketComment.create({
        ticket: ticket._id,
        author: assignee._id,
        message: "Thanks for the report — I'm looking into this now.",
        isInternal: false,
      });
      commentCount += 1;

      if (isTerminal) {
        await WorkLog.create({
          ticket: ticket._id,
          technician: assignee._id,
          description: t.resolutionSummary || 'Resolved the reported issue.',
          minutesSpent: 25,
        });
        workLogCount += 1;
      }
    }

    // Notifications for a subset of tickets to populate the notification bell.
    if (assignee && !isTerminal) {
      await Notification.create({
        user: assignee._id,
        message: `Ticket ${ticketNumber} assigned to you.`,
        type: 'ASSIGNMENT',
        relatedTicket: ticket._id,
        isRead: Math.random() > 0.5,
      });
      notificationCount += 1;
    }
    if (t.breach) {
      const managers = userDocs.filter((u) => u.role === 'IT_MANAGER');
      for (const m of managers) {
        await Notification.create({
          user: m._id,
          message: `SLA breached on ticket ${ticketNumber}.`,
          type: 'SLA_BREACHED',
          relatedTicket: ticket._id,
          isRead: false,
        });
        notificationCount += 1;
      }
    }
    if (isTerminal && t.confirmed) {
      await Notification.create({
        user: (assignee || userByEmail['technician@demo.com'])._id,
        message: `${requester.name} confirmed resolution on ticket ${ticketNumber}.`,
        type: 'RESOLUTION',
        relatedTicket: ticket._id,
        isRead: true,
      });
      notificationCount += 1;
    }

    await AuditLog.create({
      actor: requester._id,
      actorName: requester.name,
      action: 'TICKET_CREATED',
      entityType: 'Ticket',
      entityId: ticket._id,
      metadata: { ticketNumber, category: finalCategory, priority: finalPriority },
      createdAt,
    });
    if (t.breach) {
      await AuditLog.create({
        action: 'SLA_BREACHED',
        entityType: 'Ticket',
        entityId: ticket._id,
        metadata: { ticketNumber, priority: finalPriority },
      });
    }
  }

  console.log(`[seed] Inserted ${ticketCount} tickets, ${commentCount} comments, ${workLogCount} work logs, ${notificationCount} notifications`);

  // Login audit trail for realism
  for (const u of userDocs) {
    await AuditLog.create({ actor: u._id, actorName: u.name, action: 'LOGIN', entityType: 'User', entityId: u._id });
  }

  console.log('\n[seed] Done! Demo accounts:');
  users.forEach((u) => console.log(`  ${u.role.padEnd(14)} ${u.email.padEnd(22)} ${u.password}`));

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
