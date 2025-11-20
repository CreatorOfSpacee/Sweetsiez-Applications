const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Configuration from environment variables
const CONFIG = {
    token: process.env.DISCORD_TOKEN,
    // Assistant Supervisor config
    asApplicationChannelId: process.env.AS_APPLICATION_CHANNEL_ID,
    asReviewChannelId: process.env.AS_REVIEW_CHANNEL_ID,
    asReviewRoleId: process.env.AS_REVIEW_ROLE_ID,
    // Executive Assistant config
    eaApplicationChannelId: process.env.EA_APPLICATION_CHANNEL_ID,
    eaReviewChannelId: process.env.EA_REVIEW_CHANNEL_ID,
    eaReviewRoleId: process.env.EA_REVIEW_ROLE_ID
};

// Store active application sessions
const activeSessions = new Map();

// Application Questions
const AS_QUESTIONS = [
    {
        id: 'activity_roblox',
        type: 'scale',
        question: '⏰ Rate your activity on ROBLOX (1-10, where 1 is Super Inactive and 10 is Super Active):',
        min: 1,
        max: 10
    },
    {
        id: 'grammar_rating',
        type: 'scale',
        question: '📚 Rate your spelling and grammar (1-10, where 1 is Pretty Bad and 10 is Super Good):',
        min: 1,
        max: 10
    },
    {
        id: 'platform',
        type: 'text',
        question: '✏️ Which platform do you play on the most?'
    },
    {
        id: 'why_apply',
        type: 'long',
        question: '✏️ Why have you decided to apply for Assistant Supervisor at Sweetsiez? What are some goals you wish to accomplish during your time on the MR team?'
    },
    {
        id: 'motivation',
        type: 'long',
        question: '✏️ Have you ever felt unmotivated in your time as a LR? If you were, how did you regain your motivation? If not, do you think that being on the MR team will motivate you?'
    },
    {
        id: 'experience',
        type: 'long',
        question: '✏️ Do you have any prior experience from ROBLOX groups? What have these opportunities taught you and how will it assist you at Sweetsiez? If you haven\'t, how will Sweetsiez benefit you later on?'
    },
    {
        id: 'negative_quality',
        type: 'long',
        question: '✏️ Do you possess a quality which you believe is negative? Why so and how do you plan on improving on it in future? How has it affected you in your past?'
    },
    {
        id: 'challenges',
        type: 'long',
        question: '✏️ Regardless if it is in real life or on ROBLOX, have you ever faced complex circumstances which have affected your work but you\'ve managed to succeed with it? Explain the situation and how it impacted you.'
    },
    {
        id: 'grammar1',
        type: 'choice',
        question: '✏️ Which of the following is the correct form of spelling?',
        choices: ['They\'re', 'Their', 'There', 'Thier']
    },
    {
        id: 'grammar2',
        type: 'choice',
        question: '✏️ Which of the following is the correct form of spelling?',
        choices: ['You\'re', 'Your', 'Yore', 'Youre']
    },
    {
        id: 'grammar3',
        type: 'choice',
        question: '✏️ Which of the following is the correct form of spelling?',
        choices: ['Accept', 'Except', 'Aksept', 'Exsept']
    },
    {
        id: 'grammar4',
        type: 'choice',
        question: '✏️ Which of the following is the correct form of spelling?',
        choices: ['Definitely', 'Definately', 'Definitly', 'Deffinitely']
    },
    {
        id: 'grammar5',
        type: 'long',
        question: '✏️ Rewrite this sentence so that it is grammatically correct:\n"i want to pass As applications because I love supervising."'
    },
    {
        id: 'grammar6',
        type: 'long',
        question: '✏️ Rewrite this sentence so that it is grammatically correct:\n"I go too the bakery every day becauze it is fun."'
    },
    {
        id: 'confirm1',
        type: 'confirm',
        question: 'Do you understand that, if you pass, you shouldn\'t resign from your position soon after?\n(Resigning soon after receiving Assistant Supervisor can lead to a permanent blacklist!)'
    },
    {
        id: 'confirm2',
        type: 'confirm',
        question: 'Do you acknowledge that you shouldn\'t change your ROBLOX or Discord username until the results are posted?'
    },
    {
        id: 'confirm3',
        type: 'confirm',
        question: 'Do you understand that you are required to be active daily as an Assistant Supervisor?'
    },
    {
        id: 'confirm4',
        type: 'text',
        question: 'Are there any other groups besides Sweetsiez that can conflict with your activity?'
    },
    {
        id: 'confirm5',
        type: 'confirm',
        question: 'Do you understand that, if you don\'t pass, there are other opportunities to receive Assistant Supervisor?\n(Taking the frustration out on the HR Team or your peers will severely damage your chances!)'
    },
    {
        id: 'confirm6',
        type: 'confirm',
        question: 'Do you understand that Sweetsiez has every right to remove you from your position for any reason?'
    }
];

const EA_QUESTIONS = [
    {
        id: 'department',
        type: 'choice',
        question: '🏢 Which department would you like to assist in?',
        choices: ['Human Resources (HR)', 'Public Relations (PR)', 'No Preference']
    },
    {
        id: 'activity_roblox',
        type: 'scale',
        question: '⏰ Rate your activity on ROBLOX (1-10, where 1 is Super Inactive and 10 is Super Active):',
        min: 1,
        max: 10
    },
    {
        id: 'grammar_rating',
        type: 'scale',
        question: '📚 Rate your spelling and grammar (1-10, where 1 is Pretty Bad and 10 is Super Good):',
        min: 1,
        max: 10
    },
    {
        id: 'why_ea',
        type: 'long',
        question: '✏️ Why have you decided to apply for Executive Assistant? What interests you about the HR/PR departments?'
    },
    {
        id: 'mr_experience',
        type: 'long',
        question: '✏️ What experience do you have from your time on the MR team? How has this prepared you for an Executive Assistant position?'
    },
    {
        id: 'department_contribution',
        type: 'long',
        question: '✏️ How do you plan to contribute to your chosen department (HR or PR)? What skills do you bring?'
    },
    {
        id: 'handle_stress',
        type: 'long',
        question: '✏️ Executive Assistants handle sensitive information and important tasks. How do you handle pressure and maintain professionalism?'
    },
    {
        id: 'availability',
        type: 'long',
        question: '✏️ Executive Assistants have higher activity requirements (35 min supervision, 1 session, 35 messages daily). Can you commit to this? Explain your availability.'
    },
    {
        id: 'scenario',
        type: 'long',
        question: '✏️ You notice a conflict between two MR team members. As an EA, how would you handle this situation?'
    },
    {
        id: 'confirm1',
        type: 'confirm',
        question: 'Do you understand that Executive Assistant is a corporate position with higher expectations and activity requirements?'
    },
    {
        id: 'confirm2',
        type: 'confirm',
        question: 'Do you acknowledge that leaking confidential information will result in immediate termination?'
    },
    {
        id: 'confirm3',
        type: 'confirm',
        question: 'Do you understand that Sweetsiez has every right to remove you from your position for any reason?'
    }
];

client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    
    // Register slash commands
    const commands = [
        new SlashCommandBuilder()
            .setName('setup')
            .setDescription('Setup application embeds in their channels')
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(CONFIG.token);

    try {
        console.log('🔄 Registering slash commands...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        console.log('✅ Slash commands registered!');
    } catch (error) {
        console.error('❌ Error registering commands:', error);
    }
});

// Handle slash commands
client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'setup') {
            await interaction.deferReply({ ephemeral: true });
            try {
                await setupApplications();
                await interaction.editReply('✅ Application embeds have been posted!');
            } catch (error) {
                console.error('Error setting up applications:', error);
                await interaction.editReply('❌ Error setting up applications. Check console for details.');
            }
        }
    }
});

// Setup application embeds
async function setupApplications() {
    // Setup Assistant Supervisor Application
    const asChannel = await client.channels.fetch(CONFIG.asApplicationChannelId);
    
    const asEmbed = new EmbedBuilder()
        .setColor('#FFC0CB')
        .setTitle('🍰 Assistant Supervisor Application')
        .setDescription('At Sweetsiez, we\'re looking for hard working, open minded members to strongly benefit our MR Team. If you think you have what it takes, apply now!')
        .addFields(
            {
                name: '📋 Position Info',
                value: 'An Assistant Supervisor is the first rank within the MR Team. They can attend trainings as well as supervise the cafe. There may only be **60 Assistant Supervisors** employed at a given time.'
            },
            {
                name: '📊 Requirements',
                value: '• 15 Minutes of Supervision Daily\n• 1 Session Attended Daily\n• 15 Messages within Discord Daily'
            },
            {
                name: '✅ Expectations',
                value: '• 3+ sentences with a decent amount of effort\n• Relatively good reputation\n• Active in Discord server & Bakery\n• You must be eligible to use Discord (13+)\n• You **CANNOT** have safechat\n\n*Successful applicants will be put through a trial.*'
            }
        )
        .setFooter({ text: 'Click the button below to begin your application!' });

    const asButton = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('apply_as')
                .setLabel('Apply for Assistant Supervisor')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📝')
        );

    await asChannel.send({ embeds: [asEmbed], components: [asButton] });

    // Setup Executive Assistant Application
    const eaChannel = await client.channels.fetch(CONFIG.eaApplicationChannelId);
    
    const eaEmbed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('⭐ Executive Assistant Application')
        .setDescription('Ready to take the next step in your Sweetsiez journey? Executive Assistants are the gateway to our HR and PR departments!')
        .addFields(
            {
                name: '📋 Position Info',
                value: 'An Executive Assistant is the first rank within the HR Team. They act as assistants to the Human Resources and Public Relations departments. There may only be **10 Executive Assistants** employed at a given time, with 5 assisting each department.'
            },
            {
                name: '📊 Requirements',
                value: '• 35 Minutes of Supervision Daily\n• 1 Session Hosted/Attended Daily\n• 35 Messages within Discord Daily'
            },
            {
                name: '💼 Responsibilities',
                value: '• Shadow department members to gain experience\n• Provide basic support to HR/PR\n• Assist in communications and internal operations\n• Prepare for specialization in your chosen department'
            }
        )
        .setFooter({ text: 'Click the button below to begin your application!' });

    const eaButton = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('apply_ea')
                .setLabel('Apply for Executive Assistant')
                .setStyle(ButtonStyle.Success)
                .setEmoji('⭐')
        );

    await eaChannel.send({ embeds: [eaEmbed], components: [eaButton] });
    console.log('✅ Application embeds posted successfully!');
}

// Handle button interactions
client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        const applicationType = interaction.customId === 'apply_as' ? 'as' : 'ea';
        
        await interaction.reply({ 
            content: '📬 Check your DMs! I\'ve sent you the application questions.', 
            ephemeral: true 
        });

        try {
            const dmChannel = await interaction.user.createDM();
            
            if (activeSessions.has(interaction.user.id)) {
                await dmChannel.send('⚠️ You already have an active application! Please complete or cancel it first.');
                return;
            }

            const session = {
                type: applicationType,
                questions: applicationType === 'as' ? AS_QUESTIONS : EA_QUESTIONS,
                currentQuestion: 0,
                answers: {},
                userId: interaction.user.id,
                username: interaction.user.tag
            };

            activeSessions.set(interaction.user.id, session);

            const welcomeEmbed = new EmbedBuilder()
                .setColor(applicationType === 'as' ? '#FFC0CB' : '#FFD700')
                .setTitle(`${applicationType === 'as' ? '🍰 Assistant Supervisor' : '⭐ Executive Assistant'} Application`)
                .setDescription(`Welcome to the application process! Please answer all questions honestly and to the best of your ability.\n\n**Total Questions:** ${session.questions.length}\n\nType \`cancel\` at any time to cancel your application.`)
                .setFooter({ text: 'Sweetsiez Applications' });

            await dmChannel.send({ embeds: [welcomeEmbed] });
            await askQuestion(dmChannel, session);
        } catch (error) {
            console.error('Error starting application:', error);
            await interaction.followUp({ 
                content: '❌ I couldn\'t DM you! Please make sure your DMs are open and try again.', 
                ephemeral: true 
            });
        }
    }
});

async function askQuestion(channel, session) {
    const question = session.questions[session.currentQuestion];
    
    const questionEmbed = new EmbedBuilder()
        .setColor(session.type === 'as' ? '#FFC0CB' : '#FFD700')
        .setTitle(`Question ${session.currentQuestion + 1}/${session.questions.length}`)
        .setDescription(question.question);

    if (question.type === 'scale') {
        questionEmbed.setFooter({ text: `Please respond with a number between ${question.min} and ${question.max}` });
    } else if (question.type === 'choice') {
        questionEmbed.addFields({
            name: 'Options',
            value: question.choices.map((c, i) => `${i + 1}. ${c}`).join('\n')
        });
        questionEmbed.setFooter({ text: 'Please respond with the number of your choice' });
    } else if (question.type === 'confirm') {
        questionEmbed.setFooter({ text: 'Please respond with "yes" or "no"' });
    } else {
        questionEmbed.setFooter({ text: 'Please provide a detailed response (3+ sentences recommended)' });
    }

    await channel.send({ embeds: [questionEmbed] });
}

// Handle DM responses
client.on('messageCreate', async message => {
    if (message.author.bot || message.channel.type !== ChannelType.DM) return;

    const session = activeSessions.get(message.author.id);
    if (!session) return;

    if (message.content.toLowerCase() === 'cancel') {
        activeSessions.delete(message.author.id);
        await message.reply('❌ Your application has been cancelled.');
        return;
    }

    const question = session.questions[session.currentQuestion];
    let answer = message.content.trim();

    // Validate answer based on question type
    if (question.type === 'scale') {
        const num = parseInt(answer);
        if (isNaN(num) || num < question.min || num > question.max) {
            await message.reply(`⚠️ Please provide a number between ${question.min} and ${question.max}.`);
            return;
        }
        answer = num;
    } else if (question.type === 'choice') {
        const choice = parseInt(answer);
        if (isNaN(choice) || choice < 1 || choice > question.choices.length) {
            await message.reply(`⚠️ Please provide a number between 1 and ${question.choices.length}.`);
            return;
        }
        answer = question.choices[choice - 1];
    } else if (question.type === 'confirm') {
        const response = answer.toLowerCase();
        if (!['yes', 'no', 'y', 'n'].includes(response)) {
            await message.reply('⚠️ Please respond with "yes" or "no".');
            return;
        }
        answer = ['yes', 'y'].includes(response) ? 'Yes' : 'No';
    } else if (question.type === 'long' && answer.length < 20) {
        await message.reply('⚠️ Please provide a more detailed response (at least 20 characters).');
        return;
    }

    session.answers[question.id] = answer;
    session.currentQuestion++;

    if (session.currentQuestion < session.questions.length) {
        await askQuestion(message.channel, session);
    } else {
        await submitApplication(message.channel, session);
        activeSessions.delete(message.author.id);
    }
});

async function submitApplication(channel, session) {
    const submitEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Application Submitted!')
        .setDescription('Thank you for applying! Your application has been submitted for review. You will be notified of the results soon.\n\nGood luck! 🍀')
        .setFooter({ text: 'Sweetsiez Applications' });

    await channel.send({ embeds: [submitEmbed] });

    // Send to appropriate review channel based on application type
    const reviewChannelId = session.type === 'as' ? CONFIG.asReviewChannelId : CONFIG.eaReviewChannelId;
    const reviewRoleId = session.type === 'as' ? CONFIG.asReviewRoleId : CONFIG.eaReviewRoleId;
    const reviewChannel = await client.channels.fetch(reviewChannelId);
    
    const reviewEmbed = new EmbedBuilder()
        .setColor(session.type === 'as' ? '#FFC0CB' : '#FFD700')
        .setTitle(`${session.type === 'as' ? '🍰 Assistant Supervisor' : '⭐ Executive Assistant'} Application`)
        .setDescription(`**Applicant:** ${session.username}\n**User ID:** ${session.userId}`)
        .setTimestamp();

    for (const question of session.questions) {
        const answer = session.answers[question.id];
        let fieldName = question.question.substring(0, 100);
        if (fieldName.length === 100) fieldName += '...';
        
        reviewEmbed.addFields({
            name: fieldName,
            value: answer.toString().substring(0, 1024),
            inline: false
        });
    }

    await reviewChannel.send({ 
        content: `<@&${reviewRoleId}> New application submitted!`,
        embeds: [reviewEmbed] 
    });
}

// Keep alive for Replit
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
    res.send('Bot is running!');
});

app.listen(port, () => {
    console.log(`🌐 Web server running on port ${port}`);
});

client.login(CONFIG.token);
